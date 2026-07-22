import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      <Stack.Screen name="post/[id]" options={{ title: 'Post Detail' }} />
      <Stack.Screen name="create" options={{ title: 'Create Post', presentation: 'modal' }} />
    </Stack>
  );
}
