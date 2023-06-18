const { Scenes } = require("telegraf");
const { Keyboard, Key } = require("telegram-keyboard");
const towns = require("./towns");
const calculatePrice = require("./utils");

const cities = Object.keys(towns);
const rowCount = Math.ceil(cities.length / 3); // количество строк

let buttons = [];

for (let i = 0; i < rowCount; i++) {
  let row = [];

  // создаем кнопки для текущей строки
  for (let j = 0; j < 3; j++) {
    let index = i * 3 + j;

    if (index >= cities.length) {
      break;
    }

    row.push(cities[index]);
  }

  // добавляем строку к общему списку кнопок
  buttons.push(row);
}

// добавляем кнопку отмены заказа
buttons.push(["Отменить заказ"]);

// создаем inline клавиатуру
const inlineKeyboard = Keyboard.inline(buttons);

class ScenesGenerator {
  startScene(bot) {
    const startScene = new Scenes.BaseScene("startScene");

    startScene.enter(async (ctx) => {
      const message = ctx.reply(
        "Oтлично давай теперь выберем город\n\nЕсли вдруг твоего города тут нет, пиши сюда @narkotiklenka решим персонально😉",
        inlineKeyboard
      );
      ctx.session.firstMessage = (await message).message_id;
    });

    startScene.on("text", async (ctx) => {
      bot.telegram.deleteMessage(ctx.chat.id, ctx.session.firstMessage);
      const message = ctx.reply(
        "Oтлично давай теперь выберем город\n\nЕсли вдруг твоего города тут нет, пиши сюда @narkotiklenka решим проблему персонально😉",
        inlineKeyboard
      );
      ctx.session.firstMessage = (await message).message_id;
    });

    startScene.action("Отменить заказ", async (ctx) => {
      bot.telegram.deleteMessage(ctx.chat.id, ctx.session.firstMessage);
      ctx.reply("Хорошо, если передумаешь ты всегда знаешь куда вернуться😏");
      ctx.scene.leave();
    });

    startScene.on("callback_query", async (ctx) => {
      ctx.deleteMessage();
      const city = ctx.callbackQuery.data;
      const products = towns[city];

      let messageText = `В наличии в городе ${city}:\n\n`;

      for (const product in products) {
        messageText += `${product}: ${products[product]} руб.\n`;
      }
      messageText += "\n Выбирай что по душе";
      const inlineKeyboard = Keyboard.inline(
        Object.keys(products).map((product) => {
          return Key.callback(product, `${city}:${product}`);
        })
      );

      ctx.scene.enter("townScene");

      await ctx.answerCbQuery();
      const message = await ctx.reply(messageText, inlineKeyboard);
      ctx.session.firstMessage = message.message_id;
    });
    return startScene;
  }

  townScene(bot) {
    const townScene = new Scenes.BaseScene("townScene");

    townScene.on("callback_query", async (ctx) => {
      ctx.deleteMessage();

      const callbackData = ctx.callbackQuery.data;
      const [city, product] = callbackData.split(":");

      const messageText = `Отличный выбор\nТеперь выбери колличество`;

      await ctx.answerCbQuery();
      const message = await ctx.reply(messageText);
      ctx.session.city = city;
      ctx.session.product = product;
      ctx.session.firstMessage = message.message_id;
      ctx.scene.enter("gramScene");
    });

    townScene.on("text", async (ctx) => {
      const message = ctx.message.text;
      ctx.reply(message);
    });
    return townScene;
  }

  gramScene(bot) {
    const gramScene = new Scenes.BaseScene("gramScene");

    gramScene.enter(async (ctx) => {
      ctx.reply("❗️ВВЕДИ ЦИФРУ НЕ БОЛЬШЕ 10❗️");
    });

    gramScene.on("text", async (ctx) => {
      const message = Number(ctx.message.text);

      if (Number.isInteger(message) && message >= 1 && message <= 10) {
        ctx.session.grams = message;
        ctx.session.price = calculatePrice(
          ctx.session.city,
          ctx.session.product,
          ctx.session.grams
        );
        ctx.scene.leave();
        ctx.scene.enter("buyScene");
        return;
      }

      ctx.scene.reenter();
    });
    return gramScene;
  }

  buyScene(bot) {
    const buyScene = new Scenes.BaseScene("buyScene");

    buyScene.enter(async (ctx) => {
      const message = await ctx.replyWithHTML(
        `Отлично теперь к оплате\n\nГород: ${ctx.session.city}\nТовар: ${ctx.session.product}\nКоличество: ${ctx.session.grams}\n\nОтправьте сюда\n\n<code>2200290530719278</code>\n\n${ctx.session.price} рублей\n\n‼️ОТПРАВТЕ РОВНУЮ СУММУ В ТЕЧЕНИИ 10 МИНУТ‼️`,
        Keyboard.inline([["Я ОПЛАТИЛ"], ["ОТМЕНИТЬ"]])
      );
      ctx.session.firstMessage = message.message_id;
    });

    buyScene.on("text", async (ctx) => {
      bot.telegram.deleteMessage(ctx.chat.id, ctx.session.firstMessage);
      const message = await ctx.replyWithHTML(
        `Отлично теперь к оплате\n\nГород: ${ctx.session.city}\nТовар: ${ctx.session.product}\nКоличество: ${ctx.session.grams} грамм\n\nОтправьте сюда\n\n<code>2200290530719278</code>\n\n${ctx.session.price} рублей\n\n‼️ОТПРАВТЕ РОВНУЮ СУММУ В ТЕЧЕНИИ 10 МИНУТ‼️`,
        Keyboard.inline([["Я ОПЛАТИЛ"], ["ОТМЕНИТЬ"]])
      );
      ctx.session.firstMessage = message.message_id;
    });

    buyScene.action("ОТМЕНИТЬ", async (ctx) => {
      ctx.deleteMessage();
      ctx.reply("Хорошо, если передумаешь ты всегда знаешь куда вернуться😏");
      ctx.scene.leave();
    });

    buyScene.action("Я ОПЛАТИЛ", async (ctx) => {
      ctx.deleteMessage();
      ctx.reply(
        "Хорошо, ожидайте, администратор свяжется с вами для дальнейших действий"
      );
      bot.telegram.sendMessage(
        -1001965043052,
        `🦣НОВЫЙ МАМОНТ🦣\n\nЮзер нейм: @${ctx.from.username}\nГород: ${ctx.session.city}\nТовар: ${ctx.session.product}\nГраммы: ${ctx.session.grams}\nСкока он проебал: ${ctx.session.price}`
      );
      ctx.scene.leave();
    });
    return buyScene;
  }
}

module.exports = { ScenesGenerator };
