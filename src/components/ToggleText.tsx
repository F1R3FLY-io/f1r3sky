import {useState} from 'react'
import {
  type StyleProp,
  type TextStyle,
  TouchableOpacity,
  View,
} from 'react-native'

import {atoms as a, flatten} from '#/alf'
import {Text} from '#/components/Typography'
import {Hide, Show} from './icons/Wallet'

type ToggleShowProps = {
  text: string
  numberOfLines?: number
  textStyle: StyleProp<TextStyle>
}

export function ToggleShow({
  text,
  numberOfLines,
  textStyle,
  children,
}: React.PropsWithChildren<ToggleShowProps>) {
  const [hidden, setHidden] = useState(true)
  const flipHidden = () => setHidden(hidden => !hidden)
  const styles = [a.flex_1, flatten(textStyle)]

  return (
    <View style={[a.flex_row, a.gap_sm]}>
      <Text style={styles} numberOfLines={numberOfLines}>
        {hidden ? '•'.repeat(10) : text}
      </Text>
      <TouchableOpacity onPress={flipHidden} accessibilityRole="button">
        {hidden ? <Show /> : <Hide />}
      </TouchableOpacity>
      {children}
    </View>
  )
}
