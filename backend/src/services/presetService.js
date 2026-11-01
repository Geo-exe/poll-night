import crypto from 'crypto';
import { PresetRepository } from '../repositories/presetRepository.js';

const parseAttributes = (value) => {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

export class PresetService {
  static getAllPresets() {
    return PresetRepository.findAll().map(preset => ({
      ...preset,
      attributes: parseAttributes(preset.attributes)
    }));
  }

  static createPreset({ name, attributes = [] }) {
    const preset = {
      id: crypto.randomUUID(),
      name: (name || '').trim(),
      attributes: attributes.filter(a => a && (a.key || a.value)),
      created_at: Date.now()
    };
    if (!preset.name) {
      const err = new Error('Preset name is required');
      err.statusCode = 400;
      throw err;
    }
    PresetRepository.create(preset);
    return preset;
  }

  static updatePreset(id, { name, attributes = [] }) {
    const existing = PresetRepository.findById(id);
    if (!existing) {
      const err = new Error('Preset not found');
      err.statusCode = 404;
      throw err;
    }
    const preset = {
      name: (name || existing.name).trim(),
      attributes: attributes.filter(a => a && (a.key || a.value))
    };
    PresetRepository.update(id, preset);
    return { id, ...preset };
  }

  static deletePreset(id) {
    PresetRepository.delete(id);
    return { success: true };
  }
}
