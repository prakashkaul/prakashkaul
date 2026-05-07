import {
  calculateAcademicResult,
  rubric,
  validateSubjects,
  type AcademicResult,
  type SubjectMark,
} from './calculator.js';

const addSubjectButton = document.querySelector<HTMLButtonElement>('#addSubjectButton');
const form = document.querySelector<HTMLFormElement>('#marksForm');
const subjectsBody = document.querySelector<HTMLTableSectionElement>('#subjectsBody');
const rowTemplate = document.querySelector<HTMLTemplateElement>('#subjectRowTemplate');
const result = document.querySelector<HTMLDivElement>('#result');
const formError = document.querySelector<HTMLParagraphElement>('#formError');
const rubricGrid = document.querySelector<HTMLDivElement>('#rubricGrid');

function requireElement<T extends Element>(element: T | null, selector: string): T {
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

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value);
}

function renderRubric(): void {
  elements.rubricGrid.innerHTML = rubric
    .map(
      (item) => `
        <article class="rubric-item">
          <strong>Academic Level ${item.academicLevel}</strong>
          <span>${formatNumber(item.minPercentage)}% - ${formatNumber(item.maxPercentage)}%</span>
          <p>${item.description}</p>
        </article>
      `,
    )
    .join('');
}

function addSubjectRow(subject = '', maximum = '', obtained = ''): void {
  const rowFragment = elements.rowTemplate.content.cloneNode(true) as DocumentFragment;
  const row = rowFragment.querySelector('tr');

  if (!row) {
    throw new Error('Subject row template must include a table row.');
  }

  row.querySelector<HTMLInputElement>('input[name="subject"]')!.value = subject;
  row.querySelector<HTMLInputElement>('input[name="maximum"]')!.value = maximum;
  row.querySelector<HTMLInputElement>('input[name="obtained"]')!.value = obtained;
  row.querySelector<HTMLButtonElement>('.remove-row')!.addEventListener('click', () => {
    row.remove();

    if (elements.subjectsBody.rows.length === 0) {
      addSubjectRow();
    }
  });

  elements.subjectsBody.append(rowFragment);
}

function readSubjectMarks(): SubjectMark[] {
  return Array.from(elements.subjectsBody.rows).map((row, index) => {
    const subjectInput = requireElement(
      row.querySelector<HTMLInputElement>('input[name="subject"]'),
      `subject input for row ${index + 1}`,
    );
    const maximumInput = requireElement(
      row.querySelector<HTMLInputElement>('input[name="maximum"]'),
      `maximum marks input for row ${index + 1}`,
    );
    const obtainedInput = requireElement(
      row.querySelector<HTMLInputElement>('input[name="obtained"]'),
      `obtained marks input for row ${index + 1}`,
    );

    return {
      subject: subjectInput.value.trim(),
      maximum: Number(maximumInput.value),
      obtained: Number(obtainedInput.value),
    };
  });
}

function renderResult(academicResult: AcademicResult): void {
  const subjectRows = academicResult.subjectResults
    .map(
      (subject) => `
        <tr>
          <td>${subject.subject}</td>
          <td>${formatNumber(subject.obtained)} / ${formatNumber(subject.maximum)}</td>
          <td>${formatNumber(subject.percentage)}%</td>
          <td>AL ${subject.rubricLevel.academicLevel}</td>
        </tr>
      `,
    )
    .join('');

  elements.result.classList.remove('result-placeholder');
  elements.result.innerHTML = `
    <div class="level-badge">Aggregate AL ${academicResult.aggregateLevel}</div>
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
        <dt>Total academic level achieved</dt>
        <dd>${academicResult.aggregateLevel}</dd>
      </div>
    </dl>
    <div class="subject-results-wrap">
      <table class="subject-results">
        <thead>
          <tr>
            <th scope="col">Subject</th>
            <th scope="col">Marks</th>
            <th scope="col">Percentage</th>
            <th scope="col">Academic level</th>
          </tr>
        </thead>
        <tbody>${subjectRows}</tbody>
      </table>
    </div>
    <p>Each subject is mapped to an academic level first; the aggregate is the sum of those subject levels.</p>
  `;
}

function handleSubmit(event: SubmitEvent): void {
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
