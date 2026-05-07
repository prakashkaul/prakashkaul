# Corporation Primary Academic Grading

This repository contains a small Python implementation of Corporation Primary School's published academic grading tables.

Source: <https://www.corporationpri.moe.edu.sg/for-parents/academicgrading/> (checked 2026-05-07; page last updated 2026-03-24).

## Supported schemes

| Scheme | Use case |
| --- | --- |
| `primary_3_4` | Primary 3 and Primary 4 achievement bands |
| `primary_5_6_standard` | Primary 5 and Primary 6 standard subject Achievement Levels |
| `higher_mother_tongue` | Higher Mother Tongue grading |
| `primary_5_6_foundation` | Primary 5 and Primary 6 foundation subject grades and equivalent standard-level ALs |

Primary 1 and Primary 2 are not represented as a numeric grading scheme because the school reports subject-specific learning outcomes with qualitative descriptors rather than a common mark range table.

## Usage

```python
from src.grading import GradingScheme, grade

result = grade(88, GradingScheme.PRIMARY_5_6_STANDARD)
print(result.grade)  # AL2
```

The `grade` function accepts whole-number marks from 0 to 100 and returns a `GradeResult` containing the resolved grade, mark range, optional descriptor, and optional equivalent standard-level AL.
