const { Telegraf, session, Scenes } = require("telegraf");
const rateLimit = require("telegraf-ratelimit");
require("dotenv").config({});
const token = process.env.TOKEN;
const bot = new Telegraf(token);

const { ScenesGenerator } = require("./scenes.js");

const curScene = new ScenesGenerator();
const townScene = curScene.townScene(bot);
const startScene = curScene.startScene(bot);
const gramScene = curScene.gramScene(bot);
const buyScene = curScene.buyScene(bot);
const stage = new Scenes.Stage([townScene, startScene, gramScene, buyScene]);

const start = async () => {
  bot.catch((err) => {
    console.log(`Error occurred: ${err}`);
  });
  bot.use(session());
  bot.use(stage.middleware());

  bot.use(
    rateLimit({
      window: 3000,
      limit: 5,
    })
  );

  bot.use(require("./commands.js"));

  bot.launch();
};

start();
