package com.vionnetwork.bridge;

import cn.nukkit.Player;
import cn.nukkit.command.Command;
import cn.nukkit.command.CommandSender;
import cn.nukkit.event.Listener;
import cn.nukkit.item.Item;
import cn.nukkit.nbt.tag.CompoundTag;
import cn.nukkit.nbt.tag.ListTag;
import cn.nukkit.plugin.PluginBase;
import cn.nukkit.utils.TextFormat;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Updates;
import org.bson.Document;
import org.bson.types.ObjectId;

import java.util.ArrayList;
import java.util.List;

public class VionChest extends PluginBase implements Listener {

    private MongoClient mongoClient;
    private MongoDatabase database;
    private MongoCollection<Document> usersCollection;

    @Override
    public void onEnable() {
        saveDefaultConfig();
        setupDatabase();

        getServer().getPluginManager().registerEvents(this, this);
        getLogger().info(TextFormat.GREEN + "VionChest aktif edildi! Teslimat sistemi hazir.");
    }

    private void setupDatabase() {
        try {
            String uri = getConfig().getString("mongodb-uri");
            String dbName = getConfig().getString("database-name", "vionweb");
            mongoClient = MongoClients.create(uri);
            database = mongoClient.getDatabase(dbName);
            usersCollection = database.getCollection("users");
            getLogger().info("MongoDB baglantisi basarili!");
        } catch (Exception e) {
            getLogger().error("MongoDB baglantisi kurulamadi!");
            e.printStackTrace();
        }
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (command.getName().equalsIgnoreCase("teslim")) {
            if (!(sender instanceof Player)) {
                sender.sendMessage("Bu komut sadece oyuncular icindir.");
                return true;
            }

            Player player = (Player) sender;
            handleDelivery(player);
            return true;
        }
        return false;
    }

    private void handleDelivery(Player player) {
        if (usersCollection == null) {
            player.sendMessage(TextFormat.RED + "Hata: Veritabanı bağlantısı kurulamadı.");
            return;
        }

        player.sendMessage(TextFormat.GRAY + "Market islemleriniz kontrol ediliyor...");

        getServer().getScheduler().scheduleAsyncTask(this, new cn.nukkit.scheduler.AsyncTask() {
            @Override
            public void onRun() {
                try {
                    Document userDoc = usersCollection.find(Filters.eq("username", player.getName())).first();

                    if (userDoc == null) {
                        player.sendMessage(TextFormat.RED + "Sistemde kaydiniz bulunmadi.");
                        return;
                    }

                    List<Document> inventoryItems = userDoc.getList("inventory", Document.class);
                    List<Document> toDeliver = new ArrayList<>();

                    if (inventoryItems != null) {
                        for (Document item : inventoryItems) {
                            if ("transferred".equals(item.getString("status"))) {
                                toDeliver.add(item);
                            }
                        }
                    }

                    if (toDeliver.isEmpty()) {
                        player.sendMessage(TextFormat.YELLOW + "Bekleyen teslimatiniz bulunmuyor.");
                        return;
                    }

                    for (Document item : toDeliver) {
                        ObjectId itemOid = item.getObjectId("_id");
                        String productId = item.getString("productId");
                        String displayName = item.getString("name");

                        // Update DB First to prevent double delivery
                        long modified = usersCollection.updateOne(
                                Filters.and(
                                        Filters.eq("username", player.getName()),
                                        Filters.elemMatch("inventory", Filters.eq("_id", itemOid))),
                                Updates.set("inventory.$.status", "delivered")).getModifiedCount();

                        if (modified > 0) {
                            getServer().getScheduler().scheduleTask(VionChest.this, () -> {
                                // Broadcast
                                getServer().broadcastMessage(
                                        TextFormat.GOLD + "[VionNetwork] " + TextFormat.WHITE + player.getName() +
                                                TextFormat.YELLOW + " adlı oyuncumuz " + TextFormat.AQUA + displayName +
                                                TextFormat.YELLOW + " öğesini teslim aldı. Hayırlı Olsun!");

                                giveReward(player, productId, displayName);
                            });
                        }
                    }
                } catch (Exception e) {
                    player.sendMessage(TextFormat.RED + "Bir hata olustu, lutfen yoneticiye bildirin.");
                    e.printStackTrace();
                }
            }
        });
    }

    private void giveReward(Player player, String productId, String displayName) {
        String pName = player.getName();

        // VIP Group
        if (productId.equalsIgnoreCase("vip")) {
            getServer().dispatchCommand(getServer().getConsoleSender(), "lp user " + pName + " parent set vip");
        } else if (productId.equalsIgnoreCase("mvp")) {
            getServer().dispatchCommand(getServer().getConsoleSender(), "lp user " + pName + " parent set mvp");
        } else if (productId.equalsIgnoreCase("mvp_plus")) {
            getServer().dispatchCommand(getServer().getConsoleSender(), "lp user " + pName + " parent set mvpplus");
        }

        // Coins
        else if (productId.equalsIgnoreCase("coin_1m")) {
            getServer().dispatchCommand(getServer().getConsoleSender(), "givemoney " + pName + " 1000000");
        }

        // Keys
        else if (productId.equalsIgnoreCase("key_legend")) {
            getServer().dispatchCommand(getServer().getConsoleSender(), "key give " + pName + " efsanevi 1");
        } else if (productId.equalsIgnoreCase("key_rare")) {
            getServer().dispatchCommand(getServer().getConsoleSender(), "key give " + pName + " nadir 1");
        }

        // Tools
        else if (productId.equalsIgnoreCase("tool_pickaxe")) {
            Item pickaxe = Item.get(Item.DIAMOND_PICKAXE);
            pickaxe.setCustomName(TextFormat.RED + "EDİT KAZMA");
            CompoundTag nbt = pickaxe.getNamedTag();
            if (nbt == null)
                nbt = new CompoundTag();
            ListTag<CompoundTag> enchants = new ListTag<>("ench");
            enchants.add(new CompoundTag().putShort("id", 15).putShort("lvl", 10)); // Efficiency 10
            enchants.add(new CompoundTag().putShort("id", 17).putShort("lvl", 10)); // Unbreaking 10
            nbt.putList(enchants);
            pickaxe.setNamedTag(nbt);
            player.getInventory().addItem(pickaxe);
            player.sendMessage(TextFormat.LIGHT_PURPLE + "EFSANEVİ kazman verildi!");
        }

        player.sendMessage(TextFormat.GREEN + "Teslim edildi: " + TextFormat.WHITE + displayName);
    }

    @Override
    public void onDisable() {
        if (mongoClient != null)
            mongoClient.close();
    }
}
