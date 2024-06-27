import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
import { supabase } from '../../utils/supabaseClient';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('signupkarma')
    .setDescription('Sign up for the karma system profile'),

  async execute(interaction: CommandInteraction) {
    const userId = interaction.user.id;
    const username = interaction.user.username;

    try {
      // Check if the user already exists in the karma system
      const { data: existingProfile, error: fetchError } = await supabase
        .from('karma_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error('Error fetching user profile: ' + fetchError.message);
      }

      if (existingProfile) {
        const existingEmbed = new EmbedBuilder()
          .setColor('#36393F')
          .setTitle('Karma Profile Already Exists')
          .setDescription(`Hey ${username}, you're already part of the Karma System!`)
          .setThumbnail(interaction.user.displayAvatarURL())
          .addFields({ name: 'Next Steps', value: 'Use `/karmainfo` to check your current karma stats.' })
          .setFooter({ text: 'Karma System', iconURL: interaction.client.user?.displayAvatarURL() })
          .setTimestamp();

        await interaction.reply({ embeds: [existingEmbed], ephemeral: true });
        return;
      }

      // Insert the new profile into the karma system
      const startingKarma = 10000;
      const joinedAt = new Date().toISOString();

      const { data: newProfile, error: insertError } = await supabase
        .from('karma_profiles')
        .insert([{ 
          user_id: userId, 
          username: username, 
          karma_points: startingKarma, 
          joined_at: joinedAt 
        }])
        .single();

      if (insertError) {
        throw new Error('Error creating user profile: ' + insertError.message);
      }

      const successEmbed = new EmbedBuilder()
        .setColor('#36393F')
        .setTitle('🎉 Welcome to the Karma System! 🎉')
        .setDescription(`Congratulations, ${username}! Your karma journey begins now.`)
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
          { name: '💰 Starting Karma', value: `${startingKarma.toLocaleString()} points`, inline: true },
          { name: '🕒 Joined At', value: new Date(joinedAt).toLocaleString(), inline: true },
          { name: '\u200B', value: '\u200B' },
          { name: '📊 What\'s Next?', value: 'Start interacting with the community to earn more karma!' },
          { name: '🔍 Check Your Stats', value: 'Use `/karmainfo` to view your current karma and ranking.' }
        )
        .setImage('https://example.com/karma-banner.png') // Replace with an actual banner image URL
        .setFooter({ text: 'Karma System | Building a positive community', iconURL: interaction.client.user?.displayAvatarURL() })
        .setTimestamp();

      await interaction.reply({ embeds: [successEmbed] });

    } catch (error) {
      console.error('Error creating karma profile:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#36393F')
        .setTitle('❌ Error Creating Karma Profile')
        .setDescription('We encountered an issue while setting up your karma profile. Please try again later.')
        .addFields({ name: 'Need Help?', value: 'Contact a moderator if this issue persists.' })
        .setFooter({ text: 'Karma System Error', iconURL: interaction.client.user?.displayAvatarURL() })
        .setTimestamp();

      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
};