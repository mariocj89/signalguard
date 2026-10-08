import { Link, router } from 'expo-router';
import { Heading, Body, Card, Page, Button, usePalette } from '../ui/components';
import { t, informationURLs } from '../localization';

export default function Information() {
  const colors = usePalette();
  const urls = informationURLs();
  return <Page>
    <Heading>{t('aboutTitle')}</Heading>
    <Body>{t('about')}</Body>
    <Card>
      <Body>{t('privacy')}</Body>
      <Body muted>{t('privacyLocal')}</Body>
      <Link href={urls.privacy} accessibilityRole="link" style={{ color: colors.green, fontSize: 17, paddingVertical: 12, textDecorationLine: 'underline' }}>{t('privacyPolicy')}</Link>
      <Link href={urls.support} accessibilityRole="link" style={{ color: colors.green, fontSize: 17, paddingVertical: 12, textDecorationLine: 'underline' }}>{t('support')}</Link>
    </Card>
    <Button secondary label={t('backToHistory')} onPress={() => router.replace('/history')} />
  </Page>;
}
