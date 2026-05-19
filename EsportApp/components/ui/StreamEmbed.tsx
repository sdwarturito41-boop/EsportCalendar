import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors } from '@/constants/theme';

type StreamKind = 'twitch' | 'youtube' | 'unknown';

const parseStream = (url: string): { kind: StreamKind; embed: string } => {
  // Twitch live channel : on ignore les /videos/, /clips/, etc.
  const twitchLive = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)\/?$/);
  if (twitchLive) {
    return {
      kind: 'twitch',
      embed: `https://player.twitch.tv/?channel=${twitchLive[1]}&parent=localhost&muted=true&autoplay=true`,
    };
  }
  // YouTube watch / live / embed / youtu.be
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|live\/))([\w-]+)/);
  if (yt) {
    return {
      kind: 'youtube',
      embed: `https://www.youtube.com/embed/${yt[1]}?autoplay=1&mute=1&playsinline=1`,
    };
  }
  return { kind: 'unknown', embed: url };
};

export interface StreamEmbedProps {
  url: string;
}

export const StreamEmbed: React.FC<StreamEmbedProps> = ({ url }) => {
  const { embed } = parseStream(url);
  return (
    <View style={styles.wrap}>
      <WebView
        source={{ uri: embed }}
        style={styles.web}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        scalesPageToFit
        startInLoadingState
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  web: { flex: 1, backgroundColor: '#000' },
});
