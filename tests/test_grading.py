import pytest

from src.grading import GradingScheme, grade, validate_mark


def test_primary_3_4_achievement_bands_include_descriptions():
    assert grade(100, GradingScheme.PRIMARY_3_4).grade == "1"
    assert grade(85, GradingScheme.PRIMARY_3_4).description == "Is very good at the subject"
    assert grade(84, GradingScheme.PRIMARY_3_4).grade == "2"
    assert grade(70, GradingScheme.PRIMARY_3_4).grade == "2"
    assert grade(69, GradingScheme.PRIMARY_3_4).grade == "3"
    assert grade(50, GradingScheme.PRIMARY_3_4).grade == "3"
    assert grade(49, GradingScheme.PRIMARY_3_4).grade == "4"
    assert grade(0, GradingScheme.PRIMARY_3_4).description == "Has not met minimum requirements for the subject"


def test_primary_5_6_standard_al_boundaries():
    boundaries = {
        90: "AL1",
        89: "AL2",
        85: "AL2",
        84: "AL3",
        80: "AL3",
        79: "AL4",
        75: "AL4",
        74: "AL5",
        65: "AL5",
        64: "AL6",
        45: "AL6",
        44: "AL7",
        20: "AL7",
        19: "AL8",
        0: "AL8",
    }

    for mark, expected_grade in boundaries.items():
        assert grade(mark, "primary_5_6_standard").grade == expected_grade


def test_higher_mother_tongue_boundaries():
    assert grade(80, GradingScheme.HIGHER_MOTHER_TONGUE).grade == "Distinction"
    assert grade(79, GradingScheme.HIGHER_MOTHER_TONGUE).grade == "Merit"
    assert grade(65, GradingScheme.HIGHER_MOTHER_TONGUE).grade == "Merit"
    assert grade(64, GradingScheme.HIGHER_MOTHER_TONGUE).grade == "Pass"
    assert grade(50, GradingScheme.HIGHER_MOTHER_TONGUE).grade == "Pass"
    assert grade(49, GradingScheme.HIGHER_MOTHER_TONGUE).grade == "Ungraded"


def test_primary_5_6_foundation_equivalent_standard_al():
    assert grade(75, GradingScheme.PRIMARY_5_6_FOUNDATION).equivalent_standard_al == 6
    assert grade(74, GradingScheme.PRIMARY_5_6_FOUNDATION).grade == "B"
    assert grade(30, GradingScheme.PRIMARY_5_6_FOUNDATION).equivalent_standard_al == 7
    assert grade(29, GradingScheme.PRIMARY_5_6_FOUNDATION).grade == "C"


def test_validate_mark_rejects_invalid_values():
    with pytest.raises(ValueError):
        validate_mark(-1)
    with pytest.raises(ValueError):
        validate_mark(101)
    with pytest.raises(ValueError):
        validate_mark(99.5)
    with pytest.raises(TypeError):
        validate_mark(True)
