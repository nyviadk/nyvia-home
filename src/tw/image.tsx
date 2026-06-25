import { Image as RNImage } from 'expo-image';
import React from 'react';
import { StyleSheet } from 'react-native';
import { useCssElement } from 'react-native-css';

function CSSImage(props: React.ComponentProps<typeof RNImage>) {
  // @ts-expect-error: Remap objectFit/objectPosition til expo-image props
  const { objectFit, objectPosition, ...style } = StyleSheet.flatten(props.style) || {};

  return (
    <RNImage
      contentFit={objectFit}
      contentPosition={objectPosition}
      {...props}
      source={typeof props.source === 'string' ? { uri: props.source } : props.source}
      style={style}
    />
  );
}

export const Image = (
  props: React.ComponentProps<typeof CSSImage> & { className?: string }
) => useCssElement(CSSImage, props, { className: 'style' });
Image.displayName = 'CSS(Image)';
