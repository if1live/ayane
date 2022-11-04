namespace Ayane.Shared

open MagicOnion

type IMyFirstService =
    inherit IService<IMyFirstService>

    abstract member SumAsync: x: int -> y: int -> UnaryResult<int>
