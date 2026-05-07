import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  calculateAcademicResult,
  findRubricLevel,
  validateSubjects,
} from '../src/calculator.js';

describe('academic calculator', () => {
  it('calculates each subject academic level before summing the aggregate level', () => {
    const result = calculateAcademicResult([
      { subject: 'English', maximum: 100, obtained: 92 },
      { subject: 'Mathematics', maximum: 100, obtained: 86 },
      { subject: 'Science', maximum: 100, obtained: 78 },
      { subject: 'History', maximum: 100, obtained: 66 },
    ]);

    assert.equal(result.totalMaximum, 400);
    assert.equal(result.totalObtained, 322);
    assert.deepEqual(
      result.subjectResults.map((subject) => subject.rubricLevel.academicLevel),
      [1, 2, 4, 5],
    );
    assert.equal(result.aggregateLevel, 12);
  });

  it('validates that obtained marks cannot exceed maximum marks', () => {
    const validationError = validateSubjects([
      { subject: 'History', maximum: 100, obtained: 110 },
    ]);

    assert.equal(validationError, 'Marks obtained cannot exceed maximum marks for History.');
  });

  it('maps supplied rubric boundary percentages deterministically', () => {
    assert.equal(findRubricLevel(90).academicLevel, 1);
    assert.equal(findRubricLevel(89.99).academicLevel, 2);
    assert.equal(findRubricLevel(85).academicLevel, 2);
    assert.equal(findRubricLevel(84.99).academicLevel, 3);
    assert.equal(findRubricLevel(80).academicLevel, 3);
    assert.equal(findRubricLevel(79.99).academicLevel, 4);
    assert.equal(findRubricLevel(75).academicLevel, 4);
    assert.equal(findRubricLevel(74.99).academicLevel, 5);
    assert.equal(findRubricLevel(65).academicLevel, 5);
    assert.equal(findRubricLevel(64.99).academicLevel, 6);
    assert.equal(findRubricLevel(45).academicLevel, 6);
    assert.equal(findRubricLevel(44.99).academicLevel, 7);
    assert.equal(findRubricLevel(20).academicLevel, 7);
    assert.equal(findRubricLevel(19.99).academicLevel, 8);
    assert.equal(findRubricLevel(0).academicLevel, 8);
  });
});
