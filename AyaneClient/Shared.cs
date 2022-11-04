using System;
using MagicOnion;

namespace AyaneShared;

public interface IMyFirstService : IService<IMyFirstService>
{
    UnaryResult<int> SumAsync(int x, int y);
}