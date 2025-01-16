import React, { useCallback, useRef } from 'react'
import PropTypes from 'prop-types'
import {
  Platform,
  StyleSheet,
  TextInput,
  TextInputProps,
  NativeSyntheticEvent,
  TextInputContentSizeChangeEventData,
} from 'react-native'
import { MIN_COMPOSER_HEIGHT, DEFAULT_PLACEHOLDER } from './Constant'
import Color from './Color'
import { StylePropType } from './utils'

export interface ComposerProps {
  composerHeight?: number
  minComposerHeight?: number
  text?: string
  placeholder?: string
  placeholderTextColor?: string
  textInputProps?: Partial<TextInputProps>
  textInputStyle?: TextInputProps['style']
  textInputAutoFocus?: boolean
  keyboardAppearance?: TextInputProps['keyboardAppearance']
  multiline?: boolean
  disableComposer?: boolean
  onTextChanged?(text: string): void
  onInputSizeChanged?(layout: { width: number, height: number }): void
}

export function Composer ({
  composerHeight = MIN_COMPOSER_HEIGHT,
  minComposerHeight = MIN_COMPOSER_HEIGHT,
  disableComposer = false,
  keyboardAppearance = 'default',
  multiline = true,
  onInputSizeChanged,
  onTextChanged,
  placeholder = DEFAULT_PLACEHOLDER,
  placeholderTextColor = Color.defaultColor,
  text = '',
  textInputAutoFocus = false,
  textInputProps,
  textInputStyle,
}: ComposerProps): React.ReactElement {
  const dimensionsRef = useRef<{ width: number; height: number }>();
  const needsToAddLine = useRef(false);
  const currentHeight = useRef(minComposerHeight);

  const lineHeight = textInputStyle.lineHeight || 18
  const padding = minComposerHeight - lineHeight

  const determineInputSizeChange = useCallback(
    (dimensions: { width: number, height: number }) => {
      // Support earlier versions of React Native on Android.
      if (!dimensions)
        return

      if (
        !dimensionsRef.current ||
        (dimensionsRef.current &&
          (dimensionsRef.current.width !== dimensions.width ||
            dimensionsRef.current.height !== dimensions.height))
      ) {
        dimensionsRef.current = dimensions
        onInputSizeChanged?.(dimensions)
      }
    },
    [onInputSizeChanged]
  )

  const handleContentSizeChange = useCallback(
    ({
      nativeEvent: { contentSize },
    }: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      const lineCount = Math.ceil((contentSize.height - padding) / lineHeight);
      if (contentSize.height > currentHeight.current)
        needsToAddLine.current = true;
      determineInputSizeChange({
        height: Math.max(
          minComposerHeight,
          minComposerHeight + (lineCount - 1) * lineHeight
        ),
        width: contentSize.width || 0,
      });
      currentHeight.current = Math.max(
        minComposerHeight,
        minComposerHeight + (lineCount - 1) * lineHeight
      );
    },
    [determineInputSizeChange, currentHeight.current]
  );

  function insertNewlineAtLastSpace(str: string) {
    if (str.length === 0 || str.endsWith('\n')) return str;

    const lastSpaceIndex = str.lastIndexOf(' ');

    if (lastSpaceIndex !== -1 && str.length - lastSpaceIndex < 12) {
      return (
        str.slice(0, lastSpaceIndex) +
        '\n' +
        str.slice(lastSpaceIndex + 1)
      );
    }
    return str.slice(0, -1) + '\n' + str.slice(-1);
  }

  const handleChangeText = (newText: string) => {
    const newStr = needsToAddLine.current
      ? insertNewlineAtLastSpace(newText)
      : newText;
    if (onTextChanged) onTextChanged(newStr);
    needsToAddLine.current = false;

    const tmpText = text;

    if (newStr.split('\n').length !== tmpText.split('\n').length) {
      determineInputSizeChange({
        height: Math.max(
          minComposerHeight,
          minComposerHeight + (newStr.split('\n').length - 1) * lineHeight
        ),
        width: dimensionsRef.current?.width || 0,
      });
      currentHeight.current = Math.max(
          minComposerHeight,
          minComposerHeight + (newStr.split('\n').length - 1) * lineHeight
      );
      return;
    }
    if (newStr.split('\n').length === 1) {
      determineInputSizeChange({
        height: minComposerHeight,
        width: dimensionsRef.current?.width || 0,
      });
      currentHeight.current = minComposerHeight;
    }
  };
  return (
    <TextInput
      testID={placeholder}
      accessible
      accessibilityLabel={placeholder}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor}
      multiline={multiline}
      editable={!disableComposer}
      onContentSizeChange={handleContentSizeChange}
      onChangeText={handleChangeText}
      style={[
        styles.textInput,
        textInputStyle,
        {
          height: composerHeight,
          ...Platform.select({
            web: {
              outlineWidth: 0,
              outlineColor: 'transparent',
              outlineOffset: 0,
            },
          }),
        },
      ]}
      autoFocus={textInputAutoFocus}
      value={text}
      enablesReturnKeyAutomatically
      underlineColorAndroid='transparent'
      keyboardAppearance={keyboardAppearance}
      {...textInputProps}
    />
  )
}

Composer.propTypes = {
  composerHeight: PropTypes.number,
  text: PropTypes.string,
  placeholder: PropTypes.string,
  placeholderTextColor: PropTypes.string,
  textInputProps: PropTypes.object,
  onTextChanged: PropTypes.func,
  onInputSizeChanged: PropTypes.func,
  multiline: PropTypes.bool,
  disableComposer: PropTypes.bool,
  textInputStyle: StylePropType,
  textInputAutoFocus: PropTypes.bool,
  keyboardAppearance: PropTypes.string,
}

const styles = StyleSheet.create({
  textInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    lineHeight: 22,
    ...Platform.select({
      web: {
        paddingTop: 6,
        paddingLeft: 4,
      },
    }),
    marginTop: Platform.select({
      ios: 6,
      android: 0,
      web: 6,
    }),
    marginBottom: Platform.select({
      ios: 5,
      android: 3,
      web: 4,
    }),
  },
})
