"""Corporation Primary School academic grading helpers.

The grading tables are based on Corporation Primary School's published
"Academic Grading" page, last checked on 2026-05-07:
https://www.corporationpri.moe.edu.sg/for-parents/academicgrading/
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Iterable, TypeVar


class GradingScheme(str, Enum):
    """Supported Corporation Primary grading schemes."""

    PRIMARY_3_4 = "primary_3_4"
    PRIMARY_5_6_STANDARD = "primary_5_6_standard"
    HIGHER_MOTHER_TONGUE = "higher_mother_tongue"
    PRIMARY_5_6_FOUNDATION = "primary_5_6_foundation"


@dataclass(frozen=True)
class GradeResult:
    """A resolved grade for a mark under a specific grading scheme."""

    scheme: GradingScheme
    grade: str
    min_mark: int
    max_mark: int
    description: str | None = None
    equivalent_standard_al: int | None = None


@dataclass(frozen=True)
class _Range:
    min_mark: int
    max_mark: int
    grade: str
    description: str | None = None
    equivalent_standard_al: int | None = None

    def contains(self, mark: int) -> bool:
        return self.min_mark <= mark <= self.max_mark


_RANGES: dict[GradingScheme, tuple[_Range, ...]] = {
    GradingScheme.PRIMARY_3_4: (
        _Range(85, 100, "1", "Is very good at the subject"),
        _Range(70, 84, "2", "Is good in the subject"),
        _Range(50, 69, "3", "Has adequate grasp of the subject"),
        _Range(0, 49, "4", "Has not met minimum requirements for the subject"),
    ),
    GradingScheme.PRIMARY_5_6_STANDARD: (
        _Range(90, 100, "AL1"),
        _Range(85, 89, "AL2"),
        _Range(80, 84, "AL3"),
        _Range(75, 79, "AL4"),
        _Range(65, 74, "AL5"),
        _Range(45, 64, "AL6"),
        _Range(20, 44, "AL7"),
        _Range(0, 19, "AL8"),
    ),
    GradingScheme.HIGHER_MOTHER_TONGUE: (
        _Range(80, 100, "Distinction"),
        _Range(65, 79, "Merit"),
        _Range(50, 64, "Pass"),
        _Range(0, 49, "Ungraded"),
    ),
    GradingScheme.PRIMARY_5_6_FOUNDATION: (
        _Range(75, 100, "A", equivalent_standard_al=6),
        _Range(30, 74, "B", equivalent_standard_al=7),
        _Range(0, 29, "C", equivalent_standard_al=8),
    ),
}


T = TypeVar("T", int, float)


def validate_mark(mark: T) -> int:
    """Return *mark* as an integer percentage after validating it is 0-100."""

    if isinstance(mark, bool) or not isinstance(mark, (int, float)):
        raise TypeError("mark must be a number from 0 to 100")
    if mark < 0 or mark > 100:
        raise ValueError("mark must be from 0 to 100")
    if int(mark) != mark:
        raise ValueError("mark must be a whole number")
    return int(mark)


def grade(mark: int | float, scheme: GradingScheme | str) -> GradeResult:
    """Grade a whole-number percentage mark using a supported scheme.

    Primary 1 and Primary 2 pupils use subject-specific learning outcomes and
    qualitative descriptors rather than a common mark-to-grade table, so they
    are intentionally not represented as a numeric grading scheme here.
    """

    normalized_mark = validate_mark(mark)
    normalized_scheme = GradingScheme(scheme)

    matching_range = _find_range(normalized_mark, _RANGES[normalized_scheme])
    return GradeResult(
        scheme=normalized_scheme,
        grade=matching_range.grade,
        min_mark=matching_range.min_mark,
        max_mark=matching_range.max_mark,
        description=matching_range.description,
        equivalent_standard_al=matching_range.equivalent_standard_al,
    )


def _find_range(mark: int, ranges: Iterable[_Range]) -> _Range:
    for grading_range in ranges:
        if grading_range.contains(mark):
            return grading_range
    raise ValueError(f"no grade range configured for mark {mark}")
