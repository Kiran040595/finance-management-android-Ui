import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, borderRadius } from '../styles/theme';

export const ImagePickerField = ({
  label,
  sublabel,
  value, // URI string (or array of URIs if multiple)
  onChange,
  multiple = false,
  maxCount = 3,
  aspect = [4, 3],
}) => {
  const handleSelectSource = (indexToReplace = null) => {
    Alert.alert(
      label || 'Upload Photo',
      'Choose how you want to add the photo:',
      [
        {
          text: 'Take with Camera',
          onPress: () => launchCamera(indexToReplace),
        },
        {
          text: 'Upload from Gallery',
          onPress: () => launchGallery(indexToReplace),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const launchCamera = async (indexToReplace) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is needed to capture photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect,
        quality: 0.6,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        updateValue(uri, indexToReplace);
      }
    } catch (e) {
      console.warn('Camera error:', e);
      Alert.alert('Camera Error', 'Could not open camera.');
    }
  };

  const launchGallery = async (indexToReplace) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Photo library permission is needed to choose photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect,
        quality: 0.6,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        updateValue(uri, indexToReplace);
      }
    } catch (e) {
      console.warn('Gallery error:', e);
      Alert.alert('Gallery Error', 'Could not open photo gallery.');
    }
  };

  const updateValue = (newUri, indexToReplace) => {
    if (multiple) {
      const currentList = Array.isArray(value) ? [...value] : [];
      if (indexToReplace !== null && indexToReplace >= 0) {
        currentList[indexToReplace] = newUri;
      } else {
        if (currentList.length < maxCount) {
          currentList.push(newUri);
        }
      }
      onChange(currentList);
    } else {
      onChange(newUri);
    }
  };

  const handleRemove = (indexToRemove = null) => {
    if (multiple) {
      const currentList = Array.isArray(value) ? [...value] : [];
      if (indexToRemove !== null) {
        currentList.splice(indexToRemove, 1);
        onChange(currentList);
      }
    } else {
      onChange(null);
    }
  };

  // Render for multiple images (e.g. Vehicle Photos up to 3)
  if (multiple) {
    const list = Array.isArray(value) ? value : [];
    const canAddMore = list.length < maxCount;

    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.counter}>{list.length} / {maxCount} photos</Text>
        </View>
        {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}

        <View style={styles.multiGrid}>
          {list.map((uri, idx) => (
            <View key={idx} style={styles.thumbnailWrapper}>
              <Image source={{ uri }} style={styles.thumbnail} />
              <View style={styles.overlayButtons}>
                <TouchableOpacity
                  style={styles.miniBtn}
                  onPress={() => handleSelectSource(idx)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="camera-reverse" size={14} color="#ffffff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.miniBtn, { backgroundColor: colors.error }]}
                  onPress={() => handleRemove(idx)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash" size={14} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {canAddMore && (
            <TouchableOpacity
              style={styles.addMoreBtn}
              onPress={() => handleSelectSource(null)}
              activeOpacity={0.7}
            >
              <Ionicons name="camera-outline" size={24} color={colors.primary} />
              <Text style={styles.addMoreText}>+ Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Render for single image (Customer, Guarantor, RC, Insurance)
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}

      {value ? (
        <View style={styles.singlePreviewCard}>
          <Image source={{ uri: value }} style={styles.singleImage} resizeMode="cover" />
          <View style={styles.singleControls}>
            <TouchableOpacity
              style={styles.controlBtn}
              onPress={() => handleSelectSource(null)}
              activeOpacity={0.7}
            >
              <Ionicons name="camera" size={16} color={colors.primary} />
              <Text style={styles.controlBtnText}>Change</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlBtn, { borderColor: '#fecaca', backgroundColor: '#fef2f2' }]}
              onPress={() => handleRemove(null)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={16} color={colors.error} />
              <Text style={[styles.controlBtnText, { color: colors.error }]}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.uploadPlaceholder}
          onPress={() => handleSelectSource(null)}
          activeOpacity={0.7}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="camera" size={24} color={colors.primary} />
          </View>
          <Text style={styles.placeholderTitle}>Take Photo or Upload</Text>
          <Text style={styles.placeholderSub}>Tap to open Camera or choose from Gallery</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  sublabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  counter: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  uploadPlaceholder: {
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    backgroundColor: '#f8fafc',
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  placeholderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  placeholderSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  singlePreviewCard: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  singleImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#000000',
  },
  singleControls: {
    flexDirection: 'row',
    padding: 8,
    gap: 8,
    justifyContent: 'flex-end',
    backgroundColor: '#ffffff',
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
    gap: 4,
  },
  controlBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  multiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  thumbnailWrapper: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  overlayButtons: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    flexDirection: 'row',
    gap: 4,
  },
  miniBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMoreBtn: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    borderStyle: 'dashed',
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addMoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default ImagePickerField;
