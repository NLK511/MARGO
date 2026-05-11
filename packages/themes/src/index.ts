export interface ThemePreset {
  id: string;
  name: string;
  colors: {
    bg: string;
    surface: string;
    text: string;
    primary: string;
  };
}

export const clinicalCalm: ThemePreset = {
  id: 'clinical-calm',
  name: 'Clinical Calm',
  colors: {
    bg: '#F7FAFC',
    surface: '#FFFFFF',
    text: '#10233A',
    primary: '#2D7DD2',
  },
};
