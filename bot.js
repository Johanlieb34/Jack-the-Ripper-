const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Use environment variable for the bot token
const bot = new TelegramBot(process.env.8104826949:AAHv0ejQ11MGnZSUMjqwyD5r4LP78y3D_3A, { polling: true });

// Set up a list for tracking muted users
const mutedUsers = new Set();

// Anti-link feature variable
let antiLinkActive = false;

// Check if user is admin
const isAdmin = (chatId, userId) => {
    return bot.getChatMember(chatId, userId).then((member) => {
        return member.status === 'administrator' || member.status === 'creator';
    }).catch(() => {
        return false;
    });
};

// Anti-link command
bot.onText(/\/antilink/, (msg) => {
    const chatId = msg.chat.id;
    antiLinkActive = !antiLinkActive; // Toggle the anti-link feature
    const status = antiLinkActive ? "activated" : "deactivated";
    bot.sendMessage(chatId, `Anti-link is now ${status}!`);
});

// Kick command
bot.onText(/\/kick/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.reply_to_message.from.id; // User to kick must be mentioned in reply
    if (msg.from.id === chatId) {
        bot.kickChatMember(chatId, userId)
            .then(() => {
                bot.sendMessage(chatId, "User has been kicked.");
            })
            .catch(err => {
                bot.sendMessage(chatId, "Failed to kick user.");
            });
    }
});

// Mute command
bot.onText(/\/mute/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.reply_to_message.from.id; // User to mute must be mentioned in reply
    if (userId) {
        mutedUsers.add(userId);
        bot.sendMessage(chatId, `User has been muted.`);
    }
});

// Unmute command
bot.onText(/\/unmute/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.reply_to_message.from.id; // User to unmute must be mentioned in reply
    if (userId) {
        mutedUsers.delete(userId);
        bot.sendMessage(chatId, `User has been unmuted.`);
    }
});

// Promote command
bot.onText(/\/promote/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.reply_to_message.from.id; // User to promote must be mentioned in reply
    const isAdminUser = await isAdmin(chatId, msg.from.id);

    if (isAdminUser) {
        if (userId) {
            bot.promoteChatMember(chatId, userId, {
                can_change_info: true,
                can_post_messages: true,
                can_edit_messages: true,
                can_delete_messages: true,
                can_invite_users: true,
                can_restrict_members: true,
                can_pin_messages: true,
                can_promote_members: true
            }).then(() => {
                bot.sendMessage(chatId, "User has been promoted to admin.");
            }).catch(err => {
                bot.sendMessage(chatId, "Failed to promote user.");
            });
        }
    } else {
        bot.sendMessage(chatId, "You don't have permission to use this command.");
    }
});

// Demote command
bot.onText(/\/demote/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.reply_to_message.from.id; // User to demote must be mentioned in reply
    const isAdminUser = await isAdmin(chatId, msg.from.id);

    if (isAdminUser) {
        if (userId) {
            bot.promoteChatMember(chatId, userId, {
                can_change_info: false,
                can_post_messages: false,
                can_edit_messages: false,
                can_delete_messages: false,
                can_invite_users: false,
                can_restrict_members: false,
                can_pin_messages: false,
                can_promote_members: false
            }).then(() => {
                bot.sendMessage(chatId, "User has been demoted.");
            }).catch(err => {
                bot.sendMessage(chatId, "Failed to demote user.");
            });
        }
    } else {
        bot.sendMessage(chatId, "You don't have permission to use this command.");
    }
});

// Set name command
bot.onText(/\/setname (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const newName = match[1];
    const isAdminUser = await isAdmin(chatId, msg.from.id);

    if (isAdminUser) {
        bot.setChatTitle(chatId, newName).then(() => {
            bot.sendMessage(chatId, `Group name has been changed to "${newName}".`);
        }).catch(err => {
            bot.sendMessage(chatId, "Failed to change group name.");
        });
    } else {
        bot.sendMessage(chatId, "You don't have permission to use this command.");
    }
});

// Tag all command
bot.onText(/\/tagall/, async (msg) => {
    const chatId = msg.chat.id;
    const isAdminUser = await isAdmin(chatId, msg.from.id);

    if (isAdminUser) {
        const members = await bot.getChatAdministrators(chatId);
        const memberMentions = members.map(member => {
            return member.user.username ? `@${member.user.username}` : member.user.first_name;
        }).join(', ');
        
        bot.sendMessage(chatId, `Tagging all members:\n${memberMentions}`);
    } else {
        bot.sendMessage(chatId, "You don't have permission to use this command.");
    }
});

// Get link command
bot.onText(/\/getlink/, async (msg) => {
    const chatId = msg.chat.id;
    const isAdminUser = await isAdmin(chatId, msg.from.id);

    if (isAdminUser) {
        const link = await bot.exportChatInviteLink(chatId);
        bot.sendMessage(chatId, `Here is your invite link: ${link}`);
    } else {
        bot.sendMessage(chatId, "You don't have permission to use this command.");
    }
});

// Welcome and goodbye messages
bot.on('new_chat_members', (msg) => {
    const chatId = msg.chat.id;
    msg.new_chat_members.forEach(user => {
        bot.sendMessage(chatId, `Welcome ${user.first_name} to the group!`);
    });
});

bot.on('left_chat_member', (msg) => {
    const chatId = msg.chat.id;
    const user = msg.left_chat_member;
    bot.sendMessage(chatId, `${user.first_name} has left the group.`);
});

// Anti-link
