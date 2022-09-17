import fs, { existsSync } from 'fs';
import dotenv from 'dotenv';
import { Client, ActivityType, ApplicationCommandType, ApplicationCommandOptionType } from 'discord.js';

dotenv.config();
const client = new Client({
	intents: [],
	allowedMentions: { parse: [] },
	presence: {
		activities: [{ name: '/tag', type: ActivityType.Listening }]
	}
});

const commandsData = [
	{
		name: 'createtag',
		description: 'Creates a tag',
		type: ApplicationCommandType.ChatInput,
		dmPermission: false,
		options: [
			{ type: ApplicationCommandOptionType.String, name: 'name', description: 'The name of the tag', required: true },
			{ type: ApplicationCommandOptionType.String, name: 'content', description: 'The message to return as the output' },
			{ type: ApplicationCommandOptionType.Attachment, name: 'attachment', description: 'The attachment to return as the output' }
		]
	},
	{
		name: 'deletetag',
		description: 'Deletes a tag',
		dmPermission: false,
		type: ApplicationCommandType.ChatInput,
		options: [{ type: ApplicationCommandOptionType.String, name: 'tag', description: 'The tag to delete', autocomplete: true, required: true }]
	},
	{
		name: 'listtags',
		description: 'Lists all available tags'
	},
	{
		name: 'tag',
		description: 'Displays a tag',
		options: [{ type: ApplicationCommandOptionType.String, name: 'tag', description: 'The tag to get information about', autocomplete: true, required: true }]
	}
];

function readTags() {
	return existsSync('./tags.json') ? JSON.parse(fs.readFileSync('./tags.json')) : {};
}

function writeTags(tags) {
	fs.writeFileSync(
		'./tags.json',
		JSON.stringify(tags, (key, value) => value ?? undefined, 3)
	);
}

client.once('ready', async () => {
	console.log(`${client.user.tag} is online!`);

	client.tags = readTags();
	await client.application.commands.set(commandsData);
});

client.on('interactionCreate', async interaction => {
	if (interaction.isAutocomplete()) {
		await handleAutocomplete(interaction).catch(console.error);
	} else if (interaction.isCommand()) {
		await handleCommand(interaction).catch(error => {
			console.error(error);
			interaction.reply({ content: 'There was an error while executing this command', ephemeral: true });
		});
	}
});

async function handleAutocomplete(interaction) {
	if (interaction.commandName === 'tag' || interaction.commandName == 'deletetag') {
		const focusedValue = interaction.options.getFocused().toLowerCase();
		await interaction.respond(
			Object.keys(interaction.client.tags)
				.filter(option => option.toLowerCase().includes(focusedValue))
				.sort((a, b) => a.localeCompare(b, { sensitivity: 'base' }))
				.sort((optionA, optionB) => optionB.toLowerCase().startsWith(focusedValue) - optionA.toLowerCase().startsWith(focusedValue))
				.slice(0, 25)
				.map(option => ({ name: option, value: option }))
		);
	}
}

async function handleCommand(interaction) {
	if (interaction.commandName == 'tag') {
		const name = interaction.options.getString('tag');
		const tags = readTags();
		const tag = Object.keys(tags).find(key => key.toLowerCase() == name.toLowerCase());
		if (!tag) {
			return await interaction.reply({ content: "That tag doesn't exist", ephemeral: true });
		}

		const { content, attachments } = tags[tag];
		await interaction.reply({ content, files: attachments ? attachments : undefined });
	} else if (interaction.commandName == 'createtag') {
		const name = interaction.options.getString('name');
		const content = interaction.options.getString('content');
		const attachment = interaction.options.getAttachment('attachment');

		if (!content && !attachment) {
			return await interaction.reply({ content: 'You have to provide either a message or an attachment', ephemeral: true });
		}

		const tags = readTags();
		const tag = Object.keys(tags).find(key => key.toLowerCase() == name.toLowerCase());
		if (tag) {
			return await interaction.reply({ content: 'A tag with that name already exists', ephemeral: true });
		}

		tags[name] = { content, attachments: attachment && [attachment?.url] };
		interaction.client.tags = tags;
		writeTags(tags);
		await interaction.reply(`Succesfully created the ${name} tag`);
	} else if (interaction.commandName == 'deletetag') {
		const name = interaction.options.getString('tag');

		const tags = readTags();
		const tag = Object.keys(tags).find(key => key.toLowerCase() == name.toLowerCase());
		if (!tag) {
			return await interaction.reply({ content: "That tag doesn't exist", ephemeral: true });
		}

		delete tags[tag];
		interaction.client.tags = tags;
		writeTags(tags);
		await interaction.reply(`Succesfully deleted the ${tag} tag`);
	} else if (interaction.commandName == 'listtags') {
		const tagNames = Object.keys(readTags());
		await interaction.reply(tagNames.length > 0 ? `Available tags: ${tagNames.sort((a, b) => a.localeCompare(b, { sensitivity: 'base' })).join(', ')}` : 'No tags exist');
	}
}

await client.login(process.env.DISCORD_TOKEN);
