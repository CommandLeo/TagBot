# TagBot

## Setup

* Create a bot account at https://discord.com/developers/applications
* Go to OAuth2 > URL Generator and generate a URL with the `application.commands` scope
* Invite the bot to your server
* Install the dependencies with `npm install`
* Create a `.env` file with the `DISCORD_TOKEN` property set
* Run the bot with `node index.js`

## Commands

`/tag <tag>` - Displays a tag

`/createtag <name> [<content>] [<attachment>]` - Creates a tag

`/deletetag <tag>` - Deletes a tag

`/listtags` - Lists all available tags
