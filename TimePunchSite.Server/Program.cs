using TimePunchSite.Server.Data;
using TimePunchSite.Server.Security;

var builder = WebApplication.CreateBuilder(args);

// Add service defaults & Aspire client integrations.
builder.AddServiceDefaults();
builder.AddRedisClientBuilder("cache")
    .WithOutputCache();

// Add services to the container.
builder.Services.AddProblemDetails();

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Add the DatabaseService to the dependency injection container
// scoped lifetime is appropriate for database services to ensure a new instance per request
builder.Services.AddScoped<DatabaseService>();
builder.Services.AddScoped<PasswordService>();
builder.Services.AddScoped<EmployeeRepository>();

//var connectionString = builder.Configuration.GetConnectionString("TimePunchDB");

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseOutputCache();

var api = app.MapGroup("/api");

api.MapPost("check-login", (LoginRequest data, EmployeeRepository repo) =>
{
    // Validate inputs
    if (data.Id <= 0 || string.IsNullOrEmpty(data.Password))
        return Results.BadRequest("Invalid input data.");

    // Check login credentials against the database
    //bool isValid = DataLayer.CheckLogin(connectionString, data.Id, data.Password);
    bool isValid = repo.CheckLogin(data.Id, data.Password);

    // Return appropriate response based on login validation
    if (isValid)
    {
        return Results.Ok(new { success = true, message = "Login Successful" });
    }

    return Results.Json(new { success = false, message = "Invalid ID or Password" }, statusCode: 401);
})
.WithName("CheckLogin");

api.MapPost("get-timepunches", async () =>
{

})
.WithName("GetTimePunches");

app.MapDefaultEndpoints();

app.UseFileServer();

app.Run();
