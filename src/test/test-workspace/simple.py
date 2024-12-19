from typing import Dict, List


def func(l: List[str]) -> Dict[str, int]:
    return {v: len(v) for v in l}
