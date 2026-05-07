const rubric = [
  {
    minPercentage: 90,
    maxPercentage: 100,
    level: 'Level 5 - Outstanding',
    description: 'Consistently exceeds expected academic standards.',
  },
  {
    minPercentage: 75,
    maxPercentage: 89.99,
    level: 'Level 4 - Advanced',
    description: 'Demonstrates strong command of the expected standards.',
  },
  {
    minPercentage: 60,
    maxPercentage: 74.99,
    level: 'Level 3 - Proficient',
    description: 'Meets the expected academic standards.',
  },
  {
    minPercentage: 40,
    maxPercentage: 59.99,
    level: 'Level 2 - Developing',
    description: 'Partially meets standards and needs targeted support.',
  },
  {
    minPercentage: 0,
    maxPercentage: 39.99,
    level: 'Level 1 - Beginning',
    description: 'Needs significant academic support to meet standards.',
  },
];

const addSubjectButton = document.querySelector('#addSubjectButton');
const form = document.querySelector('#marksForm');
const subjectsBody = document.querySelector('#subjectsBody');
const rowTemplate = document.querySelector('#subjectRowTemplate');
const result = document.querySelector('#result');
const formError = document.querySelector('#formError');
const rubricGrid = document.querySelector('#rubricGrid');

function requireElement(element, selector) {
  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }

  return element;
}

const elements = {
  addSubjectButton: requireElement(addSubjectButton, '#addSubjectButton'),
  form: requireElement(form, '#marksForm'),
  subjectsBody: requireElement(subjectsBody, '#subjectsBody'),
  rowTemplate: requireElement(rowTemplate, '#subjectRowTemplate'),
  result: requireElement(result, '#result'),
  formError: requireElement(formError, '#formError'),
  rubricGrid: requireElement(rubricGrid, '#rubricGrid'),
};

function formatNumber(value) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value);
}

function renderRubric() {
  elements.rubricGrid.innerHTML = rubric
    .map(
      (item) => `
        <article class="rubric-item">
          <strong>${item.level}</strong>
          <span>${formatNumber(item.minPercentage)}% - ${formatNumber(item.maxPercentage)}%</span>
          <p>${item.description}</p>
        </article>
      `,
    )
    .join('');
}

function addSubjectRow(subject = '', maximum = '', obtained = '') {
  const rowFragment = elements.rowTemplate.content.cloneNode(true);
  const row = rowFragment.querySelector('tr');

  if (!row) {
    throw new Error('Subject row template must include a table row.');
  }

  row.querySelector('input[name="subject"]').value = subject;
  row.querySelector('input[name="maximum"]').value = maximum;
  row.querySelector('input[name="obtained"]').value = obtained;
  row.querySelector('.remove-row').addEventListener('click', () => {
    row.remove();

    if (elements.subjectsBody.rows.length === 0) {
      addSubjectRow();
    }
  });

  elements.subjectsBody.append(rowFragment);
}

function readSubjectMarks() {
  return Array.from(elements.subjectsBody.rows).map((row, index) => {
    const subjectInput = requireElement(
      row.querySelector('input[name="subject"]'),
      `subject input for row ${index + 1}`,
    );
    const maximumInput = requireElement(
      row.querySelector('input[name="maximum"]'),
      `maximum marks input for row ${index + 1}`,
    );
    const obtainedInput = requireElement(
      row.querySelector('input[name="obtained"]'),
      `obtained marks input for row ${index + 1}`,
    );

    return {
      subject: subjectInput.value.trim(),
      maximum: Number(maximumInput.value),
      obtained: Number(obtainedInput.value),
    };
  });
}

function validateSubjects(subjects) {
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

function findRubricLevel(percentage) {
  const matchedLevel = rubric.find(
    (item) => percentage >= item.minPercentage && percentage <= item.maxPercentage,
  );

  if (!matchedLevel) {
    throw new Error(`No rubric level found for ${percentage}%.`);
  }

  return matchedLevel;
}

function calculateAcademicResult(subjects) {
  const totalMaximum = subjects.reduce((sum, subject) => sum + subject.maximum, 0);
  const totalObtained = subjects.reduce((sum, subject) => sum + subject.obtained, 0);
  const percentage = (totalObtained / totalMaximum) * 100;

  return {
    totalMaximum,
    totalObtained,
    percentage,
    rubricLevel: findRubricLevel(percentage),
  };
}

function renderResult(academicResult) {
  elements.result.classList.remove('result-placeholder');
  elements.result.innerHTML = `
    <div class="level-badge">${academicResult.rubricLevel.level}</div>
    <dl class="summary-grid">
      <div>
        <dt>Total marks obtained</dt>
        <dd>${formatNumber(academicResult.totalObtained)}</dd>
      </div>
      <div>
        <dt>Total maximum marks</dt>
        <dd>${formatNumber(academicResult.totalMaximum)}</dd>
      </div>
      <div>
        <dt>Aggregate percentage</dt>
        <dd>${formatNumber(academicResult.percentage)}%</dd>
      </div>
    </dl>
    <p>${academicResult.rubricLevel.description}</p>
  `;
}

function handleSubmit(event) {
  event.preventDefault();
  elements.formError.textContent = '';

  const subjects = readSubjectMarks();
  const validationError = validateSubjects(subjects);

  if (validationError) {
    elements.formError.textContent = validationError;
    return;
  }

  renderResult(calculateAcademicResult(subjects));
}

renderRubric();
addSubjectRow('Mathematics', '100', '');
addSubjectRow('Science', '100', '');
elements.addSubjectButton.addEventListener('click', () => addSubjectRow());
elements.form.addEventListener('submit', handleSubmit);
