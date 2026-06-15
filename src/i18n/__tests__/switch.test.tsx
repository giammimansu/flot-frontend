import { describe, it, expect, beforeEach } from 'vitest';
import { act, screen } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import { renderWithI18n } from '../../test/renderWithI18n';
import { changeAppLanguage } from '../config';

function Sample() {
  const { t } = useTranslation();
  return <span data-testid="label">{t('common:save')}</span>;
}

describe('live language switch', () => {
  beforeEach(async () => {
    await changeAppLanguage('it');
  });

  it('re-renders translated text when the language changes', async () => {
    renderWithI18n(<Sample />, { lang: 'it' });
    expect(screen.getByTestId('label')).toHaveTextContent('Salva');

    await act(async () => {
      await changeAppLanguage('en');
    });
    expect(screen.getByTestId('label')).toHaveTextContent('Save');
  });
});
