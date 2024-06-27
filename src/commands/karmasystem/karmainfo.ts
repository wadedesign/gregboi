// src/commands/karmasystem/karamainfo.ts
import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
import { supabase } from '../../utils/supabaseClient';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('karamainfo')
    .setDescription('View your karma profile information'),
  async execute(interaction: CommandInteraction) {
    const userId = interaction.user.id;

    try {
      // Fetch the user's karma profile
      const { data: profile, error: fetchError } = await supabase
        .from('karma_profiles')
        .select('username, karma_points, joined_at')
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        throw new Error('Error fetching user profile: ' + fetchError.message);
      }

      if (!profile) {
        await interaction.reply({
          content: 'You do not have a karma profile yet. Use /signupkarma to create one.',
          ephemeral: true,
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('Karma Profile Information')
        .setDescription(`Here is your karma profile information, ${profile.username}!`)
        .addFields(
          { name: 'Karma Points', value: profile.karma_points.toString(), inline: true },
          { name: 'Joined At', value: new Date(profile.joined_at).toLocaleString(), inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error fetching karma profile:', error);
      await interaction.reply({
        content: 'There was an error while fetching your karma profile. Please try again later.',
        ephemeral: true,
      });
    }
  },
};
