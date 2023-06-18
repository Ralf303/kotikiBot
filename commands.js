const { Keyboard, Key } = require("telegram-keyboard");
const { Composer } = require("telegraf");

const commands = new Composer();

commands.command("start", async (ctx) => {
  try {
    ctx.reply(
      "Привет " +
        ctx.from.first_name +
        "!\n\nУ меня можно выбрать и заказать качественный товар по лучшим ценам\n\nБолее подробно => /help"
    );
  } catch (error) {
    console.log("e");
  }
});

commands.command("help", (ctx) => {
  try {
    ctx.replyWithHTML(
      "Все просто, нажимай на команду, выбирай город, товар и ожидай\n\n Давай приступим и сделаем заказ => /zakaz"
    );
  } catch (error) {
    console.log("e");
  }
});

commands.command("zakaz", (ctx) => {
  try {
    ctx.scene.enter("startScene");
  } catch (error) {
    console.log("e");
  }
});

module.exports = commands;
