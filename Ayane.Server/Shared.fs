namespace Ayane.Shared

open MagicOnion
open System.Threading.Tasks

type IMyFirstService =
    inherit IService<IMyFirstService>

    abstract member SumAsync: x: int -> y: int -> UnaryResult<int>
