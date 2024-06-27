import { SlashCommandBuilder, CommandInteraction, TextChannel, Guild, ChannelType } from 'discord.js';
import moment from 'moment';
import { CronJob } from 'cron';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-counters')
    .setDescription('Sets up member counters in the server'),
  async execute(interaction: CommandInteraction) {
    const guild = interaction.guild as Guild;
    if (!guild) {
      await interaction.reply('This command can only be used in a server.');
      return;
    }

    const totalMembersChannel = await createOrGetChannel(guild, 'total-members');
    const onlineMembersChannel = await createOrGetChannel(guild, 'online-members');

    updateCounters(guild, totalMembersChannel, onlineMembersChannel);

    const job = new CronJob('0 */5 * * * *', () => {
      updateCounters(guild, totalMembersChannel, onlineMembersChannel);
    });
    job.start();

    await interaction.reply('Member counters have been set up and will be updated every 5 minutes.');
  },
};

async function createOrGetChannel(guild: Guild, name: string): Promise<TextChannel> {
  let channel = guild.channels.cache.find(
    (channel) => channel.type === ChannelType.GuildText && channel.name === name
  ) as TextChannel;

  if (!channel) {
    channel = await guild.channels.create({
      name: name,
      type: ChannelType.GuildText,
    });
  }
  return channel;
}

async function updateCounters(guild: Guild, totalMembersChannel: TextChannel, onlineMembersChannel: TextChannel) {
  const totalMembers = guild.memberCount;
  const onlineMembers = guild.members.cache.filter((member) => member.presence?.status === 'online').size;

  await totalMembersChannel.setName(`Total Members: ${totalMembers}`);
  await onlineMembersChannel.setName(`Online Members: ${onlineMembers}`);
}
