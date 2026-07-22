import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { createPost } from '../api/posts';

export default function CreatePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePublish = async () => {
    if (!title || !content) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    
    setLoading(true);
    try {
      await createPost({
        title,
        content,
        author: 'Guest User', // In a real app, this comes from auth
      });
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to publish post.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Title</Text>
      <TextInput 
        style={styles.input} 
        value={title}
        onChangeText={setTitle}
        placeholder="Enter post title"
      />

      <Text style={styles.label}>Content</Text>
      <TextInput 
        style={[styles.input, styles.textArea]} 
        value={content}
        onChangeText={setContent}
        placeholder="Write your post content here..."
        multiline
        textAlignVertical="top"
      />

      <TouchableOpacity 
        style={styles.button} 
        onPress={handlePublish}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Publish</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  textArea: {
    height: 150,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
