package com.vionnetwork.bridge;

import cn.nukkit.Player;
import cn.nukkit.plugin.PluginBase;
import cn.nukkit.utils.Config;
import cn.nukkit.utils.TextFormat;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Updates;
import org.bson.Document;
import org.bson.types.ObjectId;

import java.util.List;

public class VionBridge extends PluginBase {

    private MongoClient mongoClient;
    private MongoDatabase database;
    private MongoCollection<Document> usersCollection;

    @Override
    public void onEnable() {
        // Config Ayarları
        saveDefaultConfig();
        Config config = getConfig();

        try {
            String uri = config.getString("mongodb-uri");
            mongoClient = MongoClients.create(uri);
            String dbName = config.getString("database-name", "vionweb");
            database = mongoClient.getDatabase(dbName);
            usersCollection = database.getCollection("users");
            getLogger().info("MongoDB Baglantisi Basarili!");
        } catch (Exception e) {
            getLogger().error("MongoDB Baglantisi Basarisiz!");
            this.getServer().getPluginManager().disablePlugin(this);
            return;
        }

        // Zamanlayıcı (OTOMATIK TESLIMAT DEVRE DISI BIRAKILDI)
        // Eşyalar artık sadece VionChest üzerinden /teslim komutu ile verilmektedir.
        /*
         * this.getServer().getScheduler().scheduleDelayedRepeatingTask(this, () -> {
         * checkRewards();
         * }, 100, 600, true);
         */

        getLogger().info(TextFormat.YELLOW + "Otomatik teslimat devre dışı. Eşyalar /teslim ile alınabilir.");
    }

    private void checkRewards() {
        // Method kept but unused to preserve compatibility/future use
        for (Player player : this.getServer().getOnlinePlayers().values()) {
            String username = player.getName();
            Document userDoc = usersCollection.find(Filters.eq("username", username)).first();

            if (userDoc == null)
                continue;

            List<Document> inventory = userDoc.getList("inventory", Document.class);
            if (inventory == null)
                continue;

            for (Document item : inventory) {
                String status = item.getString("status");
                if ("transferred".equals(status)) {
                    String productId = item.getString("productId");
                    this.getServer().getScheduler().scheduleTask(this, () -> {
                        giveReward(player, productId, item.getString("name"));
                    });
                    updateItemStatus(userDoc.getObjectId("_id"), productId, item.getDate("date"));
                }
            }
        }
    }

    private void giveReward(Player player, String productId, String itemName) {
        player.sendMessage(TextFormat.GREEN + "[VionWeb] " + TextFormat.YELLOW + itemName + " teslim edildi!");

        if (productId.equalsIgnoreCase("vip")) {
            this.getServer().dispatchCommand(this.getServer().getConsoleSender(),
                    "lp user " + player.getName() + " parent set vip");
        } else if (productId.equalsIgnoreCase("tool_pickaxe")) {
            cn.nukkit.item.Item pickaxe = cn.nukkit.item.Item.get(cn.nukkit.item.Item.DIAMOND_PICKAXE);
            pickaxe.setCustomName(TextFormat.RED + "EDİT KAZMA");
            cn.nukkit.nbt.tag.CompoundTag nbt = pickaxe.getNamedTag();
            if (nbt == null)
                nbt = new cn.nukkit.nbt.tag.CompoundTag();
            cn.nukkit.nbt.tag.ListTag<cn.nukkit.nbt.tag.CompoundTag> enchants = new cn.nukkit.nbt.tag.ListTag<>("ench");
            enchants.add(new cn.nukkit.nbt.tag.CompoundTag().putShort("id", 15).putShort("lvl", 10));
            enchants.add(new cn.nukkit.nbt.tag.CompoundTag().putShort("id", 17).putShort("lvl", 10));
            nbt.putList(enchants);
            pickaxe.setNamedTag(nbt);
            player.getInventory().addItem(pickaxe);
            player.sendMessage(TextFormat.LIGHT_PURPLE + "EFSANEVİ " + TextFormat.BOLD + "SEVİYE 10" + TextFormat.RESET
                    + TextFormat.LIGHT_PURPLE + " kazman verildi!");
        }
    }

    private void updateItemStatus(ObjectId userId, String productId, java.util.Date date) {
        usersCollection.updateOne(
                Filters.and(
                        Filters.eq("_id", userId),
                        Filters.elemMatch("inventory",
                                Filters.and(Filters.eq("productId", productId), Filters.eq("date", date)))),
                Updates.set("inventory.$.status", "delivered"));
    }

    @Override
    public void onDisable() {
        if (mongoClient != null)
            mongoClient.close();
    }
}
