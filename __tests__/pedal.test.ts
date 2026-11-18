import {
  resolveAction,
  getPresetById,
  mergeMappings,
  ACTION_LABELS,
  ALL_ACTIONS,
} from '../src/lib/pedal/mapping';
import { PEDAL_PRESETS, DEFAULT_PRESET_ID } from '../src/lib/pedal/types';

// ----------------------------------------------------------------
// getPresetById
// ----------------------------------------------------------------
describe('getPresetById', () => {
  test('mevcut preset → nesne', () => {
    const p = getPresetById('airturn_default');
    expect(p).not.toBeNull();
    expect(p?.name).toBe('AirTurn (varsayılan)');
  });

  test('olmayan preset → null', () => {
    expect(getPresetById('nonexistent')).toBeNull();
  });

  test('boş id → null', () => {
    expect(getPresetById('')).toBeNull();
  });
});

// ----------------------------------------------------------------
// resolveAction — öncelik: custom > preset > noop
// ----------------------------------------------------------------
describe('resolveAction', () => {
  test('custom mapping varsa onu kullanır', () => {
    expect(
      resolveAction('ArrowLeft', { ArrowLeft: 'transpose_down' }, 'airturn_default'),
    ).toBe('transpose_down');
  });

  test('custom yoksa preset mapping\'ine düşer', () => {
    expect(resolveAction('ArrowLeft', null, 'airturn_default')).toBe('prev_song');
    expect(resolveAction('ArrowRight', {}, 'airturn_default')).toBe('next_song');
  });

  test('preset\'te de yoksa noop', () => {
    expect(resolveAction('Q', null, 'airturn_default')).toBe('noop');
  });

  test('bilinmeyen preset id → preset bulunamaz, noop', () => {
    expect(resolveAction('ArrowLeft', null, 'fake_preset')).toBe('noop');
  });

  test('custom mapping noop\'a eşlerse noop döner (override geçerli)', () => {
    expect(
      resolveAction('ArrowLeft', { ArrowLeft: 'noop' }, 'airturn_default'),
    ).toBe('noop');
  });

  test('PageFlip preset: PageDown → next_song', () => {
    expect(resolveAction('PageDown', null, 'pageflip')).toBe('next_song');
  });

  test('iRig BlueBoard preset: D → transpose_up', () => {
    expect(resolveAction('D', null, 'irig_blueboard')).toBe('transpose_up');
  });
});

// ----------------------------------------------------------------
// mergeMappings
// ----------------------------------------------------------------
describe('mergeMappings', () => {
  test('override null → base klonu', () => {
    const base = { ArrowLeft: 'prev_song' as const };
    const merged = mergeMappings(base, null);
    expect(merged).toEqual(base);
    expect(merged).not.toBe(base); // farklı obje
  });

  test('override base alanlarını ezer', () => {
    const merged = mergeMappings(
      { ArrowLeft: 'prev_song' as const, ArrowRight: 'next_song' as const },
      { ArrowLeft: 'transpose_down' as const },
    );
    expect(merged.ArrowLeft).toBe('transpose_down');
    expect(merged.ArrowRight).toBe('next_song');
  });

  test('override yeni alan ekler', () => {
    const merged = mergeMappings(
      { ArrowLeft: 'prev_song' as const },
      { Space: 'toggle_play' as const },
    );
    expect(merged.Space).toBe('toggle_play');
    expect(merged.ArrowLeft).toBe('prev_song');
  });
});

// ----------------------------------------------------------------
// ACTION_LABELS / ALL_ACTIONS
// ----------------------------------------------------------------
describe('ACTION_LABELS / ALL_ACTIONS — sabit veri', () => {
  test('Tüm action\'ların label\'ı var', () => {
    for (const a of ALL_ACTIONS) {
      expect(ACTION_LABELS[a]).toBeTruthy();
    }
  });

  test('ALL_ACTIONS noop dahil', () => {
    expect(ALL_ACTIONS).toContain('noop');
  });

  test('ALL_ACTIONS benzersiz', () => {
    expect(new Set(ALL_ACTIONS).size).toBe(ALL_ACTIONS.length);
  });
});

// ----------------------------------------------------------------
// Preset veri bütünlüğü
// ----------------------------------------------------------------
describe('PEDAL_PRESETS veri bütünlüğü', () => {
  test('DEFAULT_PRESET_ID bir preset\'i işaret eder', () => {
    expect(getPresetById(DEFAULT_PRESET_ID)).not.toBeNull();
  });

  test('preset id\'leri benzersiz', () => {
    const ids = PEDAL_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('her preset\'in mapping\'inde sadece geçerli action\'lar var', () => {
    for (const preset of PEDAL_PRESETS) {
      for (const action of Object.values(preset.mapping)) {
        expect(ALL_ACTIONS).toContain(action);
      }
    }
  });
});
