import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('page editor source safeguards', () => {
  it('keeps split-media upload controls and block collapse UI wired', () => {
    const source = readFileSync(join(process.cwd(), 'app/tenant/pages/[pageId]/page-editor-client.tsx'), 'utf8');
    const css = readFileSync(join(process.cwd(), 'app/styles.css'), 'utf8');

    expect(source).toContain('uploadSplitMedia');
    expect(source).toContain('accept="image/*,video/*"');
    expect(source).toContain('mediaType');
    expect(source).toContain('videoUrl');
    expect(source).toContain('toggleBlockCollapsed');
    expect(source).toContain("{isCollapsed ? 'Expand' : 'Minimize'}");
    expect(css).toContain('.page-block-editor-card');
    expect(css).toContain('.block-editor-header');
  });

  it('keeps image button controls and shared text settings explicit', () => {
    const source = readFileSync(join(process.cwd(), 'app/tenant/pages/[pageId]/page-editor-client.tsx'), 'utf8');

    expect(source).toContain("const textAlignOptions = ['left', 'center', 'right', 'justify'] as const;");
    expect(source).toContain('renderTextSettingsPanel');
    expect(source).toContain('type="number" min={fontSizeInputMin} max={fontSizeInputMax} step={1}');
    expect(source).toContain("const imageButtonPositionOptions = ['top-left', 'top-center', 'top-right', 'middle-left', 'center', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'] as const;");
    expect(source).toContain("const imageButtonStyleOptions = ['primary', 'secondary', 'ghost'] as const;");
    expect(source).toContain('buttonEnabled');
    expect(source).toContain('buttonPosition');
    expect(source).toContain('buttonStyle');
    expect(source).toContain('buttonTextStyleProps');
    expect(source).toContain('buttonSpacingProps');
    expect(source).toContain('text-align-button-group');
  });
});
