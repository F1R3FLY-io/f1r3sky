import {Fragment, useEffect, useRef} from 'react'
import {StyleSheet} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import BottomSheet from '@discord/bottom-sheet/src'

import {usePalette} from '#/lib/hooks/usePalette'
import {useModalControls, useModals} from '#/state/modals'
import {FullWindowOverlay} from '#/components/FullWindowOverlay'
import {createCustomBackdrop} from '../util/BottomSheetCustomBackdrop'
import * as AddExternalWallet from './AddExternalWallet'
import * as AddWallet from './AddWallet'
import * as ChangePasswordModal from './ChangePassword'
import * as CreateOrEditListModal from './CreateOrEditList'
import * as CreateWallet from './CreateWallet'
import * as DeleteAccountModal from './DeleteAccount'
import * as InviteCodesModal from './InviteCodes'
import * as ContentLanguagesSettingsModal from './lang-settings/ContentLanguagesSettings'
import * as PostLanguagesSettingsModal from './lang-settings/PostLanguagesSettings'
import * as UserAddRemoveListsModal from './UserAddRemoveLists'
import * as WalletTransfer from './WalletTransfer'

const DEFAULT_SNAPPOINTS = ['90%']
const HANDLE_HEIGHT = 24

export function ModalsContainer() {
  const {isModalActive, activeModals} = useModals()
  const {closeModal} = useModalControls()
  const bottomSheetRef = useRef<BottomSheet>(null)
  const pal = usePalette('default')
  const activeModal = activeModals[activeModals.length - 1]

  const onBottomSheetChange = async (snapPoint: number) => {
    if (snapPoint === -1) {
      closeModal()
    }
  }

  const onClose = () => {
    bottomSheetRef.current?.close()
    closeModal()
  }

  useEffect(() => {
    if (isModalActive) {
      bottomSheetRef.current?.snapToIndex(0)
    } else {
      bottomSheetRef.current?.close()
    }
  }, [isModalActive, bottomSheetRef, activeModal?.name])

  let snapPoints: (string | number)[] = DEFAULT_SNAPPOINTS
  let element

  console.log(activeModal?.name)

  switch (activeModal?.name) {
    case 'create-or-edit-list':
      snapPoints = CreateOrEditListModal.snapPoints
      element = <CreateOrEditListModal.Component {...activeModal} />
      break
    case 'user-add-remove-lists':
      snapPoints = UserAddRemoveListsModal.snapPoints
      element = <UserAddRemoveListsModal.Component {...activeModal} />
      break
    case 'delete-account':
      snapPoints = DeleteAccountModal.snapPoints
      element = <DeleteAccountModal.Component />
      break
    case 'invite-codes':
      snapPoints = InviteCodesModal.snapPoints
      element = <InviteCodesModal.Component />
      break
    case 'content-languages-settings':
      snapPoints = ContentLanguagesSettingsModal.snapPoints
      element = <ContentLanguagesSettingsModal.Component />
      break
    case 'post-languages-settings':
      snapPoints = PostLanguagesSettingsModal.snapPoints
      element = <PostLanguagesSettingsModal.Component />
      break
    case 'change-password':
      snapPoints = ChangePasswordModal.snapPoints
      element = <ChangePasswordModal.Component />
      break
    case 'wallet-transfer':
      snapPoints = WalletTransfer.snapPoints
      element = <WalletTransfer.Component {...activeModal} />
      break
    case 'create-wallet':
      snapPoints = CreateWallet.snapPoints
      element = <CreateWallet.Component />
      break
    case 'add-wallet':
      snapPoints = AddWallet.snapPoints
      element = <AddWallet.Component />
      break
    case 'add-external-wallet':
      console.log('add-external-wallet')
      snapPoints = AddExternalWallet.snapPoints
      element = <AddExternalWallet.Component />
      break
    default:
      return null
  }

  if (snapPoints[0] === 'fullscreen') {
    return (
      <SafeAreaView style={[styles.fullscreenContainer, pal.view]}>
        {element}
      </SafeAreaView>
    )
  }

  const Container = activeModal ? FullWindowOverlay : Fragment

  return (
    <Container>
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        handleHeight={HANDLE_HEIGHT}
        index={isModalActive ? 0 : -1}
        enablePanDownToClose
        android_keyboardInputMode="adjustResize"
        keyboardBlurBehavior="restore"
        backdropComponent={
          isModalActive ? createCustomBackdrop(onClose) : undefined
        }
        handleIndicatorStyle={{backgroundColor: pal.text.color}}
        handleStyle={[styles.handle, pal.view]}
        backgroundStyle={pal.view}
        onChange={onBottomSheetChange}>
        {element}
      </BottomSheet>
    </Container>
  )
}

const styles = StyleSheet.create({
  handle: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
})
