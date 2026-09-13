import React, { useCallback, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, IconButton } from '../components/Buttons';
import { Icon, type IconName } from '../components/Icon';
import { useSettingsStore } from '../store/settingsStore';
import { usePurchaseStore } from '../store/purchaseStore';
import { useAdsStore } from '../store/adsStore';
import { showPrivacyOptionsForm } from '../services/ads';
import { PRIVACY_POLICY_URL, SUPPORT_EMAIL, TERMS_URL } from '../config/env';
import { colors, radius, spacing, type } from '../theme/tokens';

interface SettingsScreenProps {
  onClose: () => void;
}

export function SettingsScreen({ onClose }: SettingsScreenProps) {
  const insets = useSafeAreaInsets();
  const { sound, haptics, setSound, setHaptics } = useSettingsStore();
  const { adsRemoved, priceString, isBusy, purchaseRemoveAds, restore } = usePurchaseStore();
  const [busyAction, setBusyAction] = useState<'purchase' | 'restore' | null>(null);
  const offerPrivacyOptions = useAdsStore((state) => state.consent.offerPrivacyOptions);

  const handlePurchase = useCallback(async () => {
    setBusyAction('purchase');
    const result = await purchaseRemoveAds();
    setBusyAction(null);

    if (result === 'purchased') {
      Alert.alert('Thank you!', 'Ads are gone for good on this account.');
    } else if (result === 'unavailable') {
      Alert.alert('Store unavailable', 'The upgrade could not be loaded. Please try again later.');
    } else if (result === 'error') {
      Alert.alert('Purchase failed', usePurchaseStore.getState().error ?? 'Please try again.');
    }
  }, [purchaseRemoveAds]);

  const handleRestore = useCallback(async () => {
    setBusyAction('restore');
    const restored = await restore();
    setBusyAction(null);
    Alert.alert(
      restored ? 'Purchase restored' : 'Nothing to restore',
      restored
        ? 'Your ad-free upgrade is active again.'
        : 'We could not find a previous purchase on this account.',
    );
  }, [restore]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <IconButton name="close" label="Close settings" onPress={onClose} />
        <Text style={type.title}>Settings</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        <Section title="GAME">
          <ToggleRow
            icon={sound ? 'sound-on' : 'sound-off'}
            label="Sound effects"
            value={sound}
            onChange={setSound}
          />
          <ToggleRow icon="vibrate" label="Haptics" value={haptics} onChange={setHaptics} />
        </Section>

        <Section title="UPGRADE">
          {adsRemoved ? (
            <View style={styles.row}>
              <Icon name="sparkles" size={20} color={colors.success} filled />
              <Text style={[type.body, styles.rowLabel]}>Ad-free — thank you!</Text>
            </View>
          ) : (
            <>
              <View style={styles.upsell}>
                <Text style={type.body}>Remove ads forever</Text>
                <Text style={type.caption}>
                  One payment, no subscription. Banners and interstitials disappear; the rewarded
                  continue stays available whenever you want it.
                </Text>
              </View>
              <Button
                label={priceString ? `Upgrade — ${priceString}` : 'Upgrade'}
                icon="no-ads"
                onPress={handlePurchase}
                loading={isBusy && busyAction === 'purchase'}
              />
            </>
          )}
          <Button
            label="Restore purchases"
            icon="restore"
            variant="secondary"
            onPress={handleRestore}
            loading={isBusy && busyAction === 'restore'}
          />
        </Section>

        <Section title="ABOUT">
          {/* Google requires an entry point back into the consent form wherever the UMP SDK
              reports one is needed — typically the EEA, the UK and regulated US states. */}
          {offerPrivacyOptions ? (
            <LinkRow
              label="Ad privacy settings"
              onPress={() => {
                void showPrivacyOptionsForm();
              }}
            />
          ) : null}
          <LinkRow label="Privacy policy" onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} />
          <LinkRow label="Terms of use" onPress={() => Linking.openURL(TERMS_URL)} />
          <LinkRow
            label="Contact support"
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          />
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={type.label}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function ToggleRow({
  icon,
  label,
  value,
  onChange,
}: {
  icon: IconName;
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Icon name={icon} size={20} color={colors.textMuted} />
      <Text style={[type.body, styles.rowLabel]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        trackColor={{ false: colors.surfaceMuted, true: colors.accent }}
        thumbColor={colors.text}
      />
    </View>
  );
}

function LinkRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.row}
      android_ripple={{ color: colors.rippleSubtle }}
    >
      <Text style={[type.body, styles.rowLabel]}>{label}</Text>
      <Icon name="chevron-right" size={18} color={colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  spacer: { width: 48 },
  body: { paddingHorizontal: spacing.lg, gap: spacing.xl },
  section: { gap: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  rowLabel: { flex: 1 },
  upsell: { gap: spacing.xs, padding: spacing.sm },
});
