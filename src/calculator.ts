export type RubricLevel = {
  academicLevel: number;
  minPercentage: number;
  maxPercentage: number;
  description: string;
};

export type SubjectMark = {
  subject: string;
  maximum: number;
  obtained: number;
};

export type SubjectLevelResult = SubjectMark & {
  percentage: number;
  rubricLevel: RubricLevel;
};

export type AcademicResult = {
  totalMaximum: number;
  totalObtained: number;
  aggregateLevel: number;
  subjectResults: SubjectLevelResult[];
};

export const rubric: RubricLevel[] = [
  {
    academicLevel: 1,
    minPercentage: 90,
    maxPercentage: 100,
    description: 'Highest academic level band.',
  },
  {
    academicLevel: 2,
    minPercentage: 85,
    maxPercentage: 89,
    description: 'Very strong academic level band.',
  },
  {
    academicLevel: 3,
    minPercentage: 80,
    maxPercentage: 84,
    description: 'Strong academic level band.',
  },
  {
    academicLevel: 4,
    minPercentage: 75,
    maxPercentage: 79,
    description: 'Secure academic level band.',
  },
  {
    academicLevel: 5,
    minPercentage: 65,
    maxPercentage: 74,
    description: 'Developing academic level band.',
  },
  {
    academicLevel: 6,
    minPercentage: 45,
    maxPercentage: 64,
    description: 'Foundational academic level band.',
  },
  {
    academicLevel: 7,
    minPercentage: 20,
    maxPercentage: 44,
    description: 'Limited academic level band.',
  },
  {
    academicLevel: 8,
    minPercentage: 0,
    maxPercentage: 19,
    description: 'Lowest supplied academic level band.',
  },
];

export function validateSubjects(subjects: SubjectMark[]): string | null {
  if (subjects.length === 0) {
    return 'Add at least one subject before calculating.';
  }

  for (const [index, subject] of subjects.entries()) {
    const rowNumber = index + 1;

    if (!subject.subject) {
      return `Enter a subject name in row ${rowNumber}.`;
    }

    if (!Number.isFinite(subject.maximum) || subject.maximum <= 0) {
      return `Enter maximum marks greater than 0 for ${subject.subject}.`;
    }

    if (!Number.isFinite(subject.obtained) || subject.obtained < 0) {
      return `Enter marks obtained of 0 or more for ${subject.subject}.`;
    }

    if (subject.obtained > subject.maximum) {
      return `Marks obtained cannot exceed maximum marks for ${subject.subject}.`;
    }
  }

  return null;
}

export function calculatePercentage(obtained: number, maximum: number): number {
  return (obtained / maximum) * 100;
}

export function findRubricLevel(percentage: number): RubricLevel {
  const roundedPercentage = Math.floor(percentage);
  const matchedLevel = rubric.find(
    (item) => roundedPercentage >= item.minPercentage && roundedPercentage <= item.maxPercentage,
  );

  if (!matchedLevel) {
    throw new Error(`No rubric level found for ${percentage}%.`);
  }

  return matchedLevel;
}

export function calculateAcademicResult(subjects: SubjectMark[]): AcademicResult {
  const validationError = validateSubjects(subjects);

  if (validationError) {
    throw new Error(validationError);
  }

  const subjectResults = subjects.map((subject) => {
    const percentage = calculatePercentage(subject.obtained, subject.maximum);

    return {
      ...subject,
      percentage,
      rubricLevel: findRubricLevel(percentage),
    };
  });
  const totalMaximum = subjects.reduce((sum, subject) => sum + subject.maximum, 0);
  const totalObtained = subjects.reduce((sum, subject) => sum + subject.obtained, 0);
  const aggregateLevel = subjectResults.reduce(
    (sum, subject) => sum + subject.rubricLevel.academicLevel,
    0,
  );

  return {
    totalMaximum,
    totalObtained,
    aggregateLevel,
    subjectResults,
  };
}
