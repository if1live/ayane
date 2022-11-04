// using System.Threading.Tasks;
// using AyaneClient;
// using Grpc.Net.Client;

// using var channel = GrpcChannel.ForAddress("https://localhost:7253");
// var client = new Greeter.GreeterClient(channel);
// var reply = await client.SayHelloAsync(
//     new HelloRequest { Name = "GreeterClient" }
// );

// Console.WriteLine("Greeting: " + reply.Message);
// Console.WriteLine("Press any Key to exit...");
// Console.ReadKey();

using Grpc.Net.Client;
using MagicOnion.Client;
using AyaneShared;

using var channel = GrpcChannel.ForAddress("https://localhost:7253");
var client = MagicOnionClient.Create<IMyFirstService>(channel);
var result = await client.SumAsync(123, 456);
Console.WriteLine($"Result: {result}");