# VionNetwork - Minecraft Plugin Entegrasyon Rehberi

Sitenizdeki "Oyuna Aktar" butonuna basıldığında veritabanındaki eşyanın durumu `active` -> `transferred` olarak değişiyor.
Şimdi yapmanız gereken, sunucunuzda çalışacak bir eklenti (Plugin) yazmaktır. Bu eklenti veritabanını belirli aralıklarla kontrol edip, "transferred" durumundaki eşyaları oyuncuya verip durumu "delivered" yapmalıdır.

## 1. Gereksinimler (pom.xml)

Eklentinizin MongoDB'ye bağlanabilmesi için `pom.xml` dosyanıza şu bağımlılığı eklemelisiniz:

```xml
<dependencies>
    <!-- MongoDB Driver -->
    <dependency>
        <groupId>org.mongodb</groupId>
        <artifactId>mongodb-driver-sync</artifactId>
        <version>4.10.0</version>
    </dependency>
</dependencies>
```

Bunu ekledikten sonra projenizi "Shade" etmeniz gerekir (MongoDB kütüphanesini .jar içine gömmek için), yoksa sunucuda `ClassNotFoundException` alırsınız.

---

## 2. Ana Plugin Kodu (Java)

Aşağıda basit ve çalışan bir örnek `Main` sınıfı hazırladım.

### `VionBridge.java`

```java
package com.vionnetwork.bridge;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Updates;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.bukkit.Bukkit;
import org.bukkit.ChatColor;
import org.bukkit.Material;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitRunnable;

import java.util.List;

public class VionBridge extends JavaPlugin {

    private MongoClient mongoClient;
    private MongoDatabase database;
    private MongoCollection<Document> usersCollection;

    @Override
    public void onEnable() {
        // 1. Config Dosyasını Oluştur
        saveDefaultConfig();
        
        // 2. Veritabanına Bağlan
        try {
            String uri = getConfig().getString("mongodb-uri");
            mongoClient = MongoClients.create(uri);
            database = mongoClient.getDatabase("vionweb"); // Veritabanı adınız
            usersCollection = database.getCollection("users");
            getLogger().info("MongoDB Baglantisi Basarili!");
        } catch (Exception e) {
            getLogger().severe("MongoDB Baglantisi Basarisiz! Plugin devredisi birakiliyor.");
            e.printStackTrace();
            getServer().getPluginManager().disablePlugin(this);
            return;
        }

        // 3. Zamanlayıcıyı Başlat (Her 30 saniyede bir kontrol et)
        new BukkitRunnable() {
            @Override
            public void run() {
                checkRewards();
            }
        }.runTaskTimerAsynchronously(this, 100L, 600L); // 20 tick = 1 sn -> 600 tick = 30 sn
    }

    @Override
    public void onDisable() {
        if (mongoClient != null) {
            mongoClient.close();
        }
    }

    // Ödülleri Kontrol Eden Fonksiyon
    private void checkRewards() {
        for (Player player : Bukkit.getOnlinePlayers()) {
            String username = player.getName();

            // Veritabanında kullanıcıyı bul
            Document userDoc = usersCollection.find(Filters.eq("username", username)).first();
            
            if (userDoc == null) continue;

            // Envanterini kontrol et
            List<Document> inventory = userDoc.getList("inventory", Document.class);
            if (inventory == null) continue;

            boolean updated = false;

            for (Document item : inventory) {
                String status = item.getString("status");
                
                // Sadece 'transferred' olanları al
                if ("transferred".equals(status)) {
                    String productId = item.getString("productId");
                    String itemName = item.getString("name");
                    
                    // Ödülü Ver (Senkronize olarak, çünkü Bukkit API async çalışmaz)
                    new BukkitRunnable() {
                        @Override
                        public void run() {
                            giveReward(player, productId, itemName);
                        }
                    }.runTask(this);

                    // Durumu 'delivered' yap (Tekrar verilmesin diye)
                    updateItemStatus(userDoc.getObjectId("_id"), item.getString("productId"), item.getDate("date"));
                }
            }
        }
    }

    // Ödül Verme Mantığı
    private void giveReward(Player player, String productId, String itemName) {
        player.sendMessage(ChatColor.GREEN + "[VionWeb] " + ChatColor.YELLOW + "Siteden satin aldiginiz esya teslim edildi: " + ChatColor.AQUA + itemName);

        if (productId.equalsIgnoreCase("vip")) {
            Bukkit.dispatchCommand(Bukkit.getConsoleSender(), "lp user " + player.getName() + " parent set vip");
        } 
        else if (productId.equalsIgnoreCase("vip_plus")) {
            Bukkit.dispatchCommand(Bukkit.getConsoleSender(), "lp user " + player.getName() + " parent set vipplus");
        }
        else if (productId.equalsIgnoreCase("10k_para")) {
            Bukkit.dispatchCommand(Bukkit.getConsoleSender(), "eco give " + player.getName() + " 10000");
        }
        else if (productId.equalsIgnoreCase("spawner")) {
            player.getInventory().addItem(new ItemStack(Material.SPAWNER));
        }
        else {
            player.sendMessage(ChatColor.RED + "Hata: Bu ürün ID'si tanınmıyor (" + productId + "). Lütfen yetkiliye bildirin.");
        }
    }

    // Veritabanı Güncelleme (Basitleştirilmiş)
    private void updateItemStatus(ObjectId userId, String productId, java.util.Date date) {
        // Array içinde eşleşen itemin status'unu 'delivered' yap
        usersCollection.updateOne(
            Filters.and(
                Filters.eq("_id", userId),
                Filters.elemMatch("inventory", Filters.and(Filters.eq("productId", productId), Filters.eq("date", date)))
            ),
            Updates.set("inventory.$.status", "delivered")
        );
    }
}
```

## 3. Config.yml
Pluginin veritabanına bağlanabilmesi için config dosyasına `MONGODB_URI` eklemeniz gerekecek.

```yaml
mongodb-uri: "mongodb+srv://vionuser:Sifreniz@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority"
```
