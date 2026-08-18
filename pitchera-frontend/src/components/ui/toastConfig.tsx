import { Platform, View } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import CustomToast from './CustomToast';

export const toastConfig = {
  success: (props: any) => (
    <View
      style={{
        width: '100%',
        alignItems: Platform.OS === 'web' ? 'flex-end' : 'center',
        paddingRight: Platform.OS === 'web' ? 20 : 0,
        paddingTop: Platform.OS === 'web' ? null : 20,
      }}
    >
      <CustomToast
        {...props}
        type="success"
        duration={3000}
        icon={
          <Feather
            name="check-circle"
            size={22}
            color="#22C55E"
          />
        }
      />
    </View>
  ),

  error: (props: any) => (
    <View
      style={{
        width: '100%',
        alignItems: Platform.OS === 'web' ? 'flex-end' : 'center',
        paddingRight: Platform.OS === 'web' ? 20 : 0,
        paddingTop: Platform.OS === 'web' ? null : 20,
      }}
    >
      <CustomToast
        {...props}
        type="error"
        duration={3000}
        icon={
          <MaterialCommunityIcons
            name="close-circle"
            size={22}
            color="#EF4444"
          />
        }
      />
    </View>
  ),

  info: (props: any) => (
    <View
      style={{
        width: '100%',
        alignItems: Platform.OS === 'web' ? 'flex-end' : 'center',
        paddingRight: Platform.OS === 'web' ? 20 : 0,
        paddingTop: Platform.OS === 'web' ? null : 20,
      }}
    >
      <CustomToast
        {...props}
        type="info"
        duration={3000}
        icon={
          <MaterialCommunityIcons
            name="alert-circle"
            size={22}
            color="#F59E0B"
          />
        }
      />
    </View>
  ),
};