# About
**Markov BOT** is a Discord bot that uses [Markov chains](https://en.wikipedia.org/wiki/Markov_chain) to generate random sentences in the chat.

The bot randomly collects messages written by users and builds a *probability tree* used in the text generation. Firstly it randomly selects a random word and tries to select the most likely next word.

This project is inspired by **[nMarkov](https://top.gg/bot/569277281046888488)**. After it was offline for a while, my friends said me to remake the bot for our guild. They also suggested making it public and I was surprised the bot grew fast.

I also decided to develop this project to study **TypeScript** and **OOP**, then make the project source code available to everyone who wants to host their own instance. The code is not the best, but feel free to contribute and improve it.

Depending on when you are reading this, you still can add the bot on your guild: **[Top.gg page](https://top.gg/bot/903354338565570661)**.

## Hosting your own instance
If you want to download the code and run it in your own bot or make changes, it's very simple:

### Requirements
- [Node.JS](https://nodejs.org/) v16+;
- A [Discord bot](https://discord.com/developers/docs/getting-started);
- A [MongoDB](https://mongodb.com/) database;
- Hosting service (to make the bot be online 24/7) or any device that supports Node.JS.

### Configuring the environment
First, you need to install [git](https://git-scm.com/) and then clone this repository with the command `git clone https://github.com/knownasbot/markov-bot` or by clicking the **Download** button.

Go inside the repository folder and install the dependencies with `npm install`. You need to have [Node.JS](https://nodejs.org/) installed on your computer/server.

Copy the file `.env.example` and rename it to `.env`. Open the file in a text editor and fill the variables `BOT_TOKEN`, `DB_URI` and `CRYPTO_SECRET`. Variables with `#` at the beginning are optional.

You need a 128-bit hex string to make the stored texts secure. You can generate it using any tool, or with Crypto module of NodeJS:
```js
crypto.randomBytes(16).toString("hex");
// It will generate strings like:
// '0c98812d1bc43fd95d073eb183ff2087'
// 'f901e4e08421baa5ac096f62512da563'
// '3b982b6a86ce54c015aa0273814a8e9c'
// ...
```

Pick the generated hex and put it in the `CRYPTO_SECRET` variable.

### Starting the bot
After configuring the environment, build the bot code to JavaScript with the command `npm run build`. It will be transpiled to the folder `./dist/`.

Start the bot with `npm start` and have fun!

## Contributing
If you want to contribute by improving the code or translating texts to other languages, see the **[Contributing](/CONTRIBUTING.md)** before doing anything.

You can donate to me at my **[Buy Me A Coffee](https://buymeacoffee.com/knownasbot)** page. You can also support the contributors on their profiles or by contacting them.