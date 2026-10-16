const adminService = require('../src/services/adminService');
const db = require('../src/config/db');

jest.mock('../src/config/db');

describe('Dynamic Level Management Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Admin can list all levels for a language including enabled/disabled states and question counts', async () => {
    db.query.mockImplementation((sql, params) => {
      if (sql.includes('SELECT id, name, slug, enabled FROM languages')) {
        return [{ id: 1, name: 'C', slug: 'c', enabled: true }];
      }
      if (sql.includes('FROM levels lvl')) {
        return [
          {
            id: 1,
            language_id: 1,
            level_number: 1,
            title: 'Fundamentals',
            description: 'Basic C syntax',
            enabled: 1,
            created_at: '2026-01-01',
            active_questions: 5,
            total_questions: 5
          },
          {
            id: 7,
            language_id: 1,
            level_number: 7,
            title: 'Advanced Practice',
            description: 'New level',
            enabled: 0,
            created_at: '2026-01-02',
            active_questions: 0,
            total_questions: 0
          }
        ];
      }
      return [];
    });

    const result = await adminService.getLanguageLevelsAdmin('c');
    expect(result.language.name).toBe('C');
    expect(result.levels.length).toBe(2);
    expect(result.levels[0].levelNumber).toBe(1);
    expect(result.levels[0].enabled).toBe(true);
    expect(result.levels[0].isEmpty).toBe(false);
    expect(result.levels[1].levelNumber).toBe(7);
    expect(result.levels[1].enabled).toBe(false);
    expect(result.levels[1].isEmpty).toBe(true);
  });

  test('Admin can create a new level (e.g. Level 7) with next auto-assigned number or explicit number', async () => {
    db.query.mockImplementation((sql, params) => {
      if (sql.includes('SELECT id, name, slug, enabled FROM languages')) {
        return [{ id: 1, name: 'C', slug: 'c', enabled: true }];
      }
      if (sql.includes('SELECT MAX(level_number)')) {
        return [{ max_num: 6 }];
      }
      if (sql.includes('SELECT id FROM levels WHERE language_id = ? AND level_number = ?')) {
        return []; // No conflict
      }
      if (sql.includes('INSERT INTO levels')) {
        return { insertId: 25 };
      }
      return [];
    });

    const result = await adminService.createLanguageLevelAdmin(1, {
      title: 'Level 7 - Data Structures in C',
      description: 'Pointers and linked lists'
    });

    expect(result.success).toBe(true);
    expect(result.level.levelNumber).toBe(7);
    expect(result.level.title).toBe('Level 7 - Data Structures in C');
    expect(result.level.id).toBe(25);
  });

  test('Admin cannot create duplicate level number for the same language', async () => {
    db.query.mockImplementation((sql, params) => {
      if (sql.includes('SELECT id, name, slug, enabled FROM languages')) {
        return [{ id: 1, name: 'C', slug: 'c', enabled: true }];
      }
      if (sql.includes('SELECT id FROM levels WHERE language_id = ? AND level_number = ?')) {
        return [{ id: 1 }]; // Conflict!
      }
      return [];
    });

    await expect(
      adminService.createLanguageLevelAdmin(1, {
        levelNumber: 1,
        title: 'Duplicate Level',
        description: 'Should fail'
      })
    ).rejects.toThrow('already exists');
  });

  test('Admin can update an existing level title and description', async () => {
    db.query.mockImplementation((sql, params) => {
      if (sql.includes('SELECT id, language_id, level_number, title, description, enabled FROM levels')) {
        return [{ id: 7, language_id: 1, level_number: 7, title: 'Old Title', description: 'Old Desc', enabled: 1 }];
      }
      if (sql.includes('UPDATE levels')) {
        return { affectedRows: 1 };
      }
      return [];
    });

    const result = await adminService.updateLevelAdmin(7, {
      title: 'Updated Title',
      description: 'Updated Description'
    });

    expect(result.success).toBe(true);
    expect(result.level.title).toBe('Updated Title');
    expect(result.level.description).toBe('Updated Description');
  });

  test('Admin can toggle enabled status of a level', async () => {
    db.query.mockImplementation((sql, params) => {
      if (sql.includes('SELECT id, language_id, level_number, title, enabled FROM levels')) {
        return [{ id: 7, language_id: 1, level_number: 7, title: 'Test Level', enabled: 1 }];
      }
      if (sql.includes('UPDATE levels SET enabled = ?')) {
        return { affectedRows: 1 };
      }
      return [];
    });

    const result = await adminService.toggleLevelStatusAdmin(7, false);
    expect(result.success).toBe(true);
    expect(result.level.enabled).toBe(false);
  });

  test('Admin cannot delete a level containing questions', async () => {
    db.query.mockImplementation((sql, params) => {
      if (sql.includes('SELECT id, level_number, language_id FROM levels')) {
        return [{ id: 1, level_number: 1, language_id: 1 }];
      }
      if (sql.includes('SELECT COUNT(*) AS total FROM questions WHERE level_id = ?')) {
        return [{ total: 5 }];
      }
      return [];
    });

    await expect(adminService.deleteLevelAdmin(1)).rejects.toThrow(
      'Cannot delete Level 1 because it contains 5 question(s)'
    );
  });

  test('Admin can safely delete an empty level', async () => {
    db.query.mockImplementation((sql, params) => {
      if (sql.includes('SELECT id, level_number, language_id FROM levels')) {
        return [{ id: 7, level_number: 7, language_id: 1 }];
      }
      if (sql.includes('SELECT COUNT(*) AS total FROM questions WHERE level_id = ?')) {
        return [{ total: 0 }];
      }
      if (sql.includes('DELETE FROM levels WHERE id = ?')) {
        return { affectedRows: 1 };
      }
      return [];
    });

    const result = await adminService.deleteLevelAdmin(7);
    expect(result.success).toBe(true);
    expect(result.message).toContain('deleted successfully');
  });
});
