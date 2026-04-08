using Microsoft.Data.SqlClient;
using System.Diagnostics;
using TimePunchSite.Server;

// For more information on how to configure your application, visit https://aka.ms/aspnet/core/fundamentals/app-configuration.
//TODO: Move the connection string to a secure location, such as Azure Key Vault or environment variables, and do not hardcode sensitive information in the codebase.
var sqlBuilder = new SqlConnectionStringBuilder
{
    DataSource = "timepunch-site-server.database.windows.net,1433",
    UserID = "AnthonyFelker",
    Password = "Felker12",
    InitialCatalog = "TimePunchSiteDB",
    ConnectTimeout = 30
};

var connectionString = sqlBuilder.ConnectionString;
// end of connection string setup ====== dont forget. move this to a secure location before deploying the application.

var builder = WebApplication.CreateBuilder(args);

// Add service defaults & Aspire client integrations.
builder.AddServiceDefaults();
builder.AddRedisClientBuilder("cache")
    .WithOutputCache();

// Add services to the container.
builder.Services.AddProblemDetails();

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Configure CORS to allow requests from the React frontend (adjust the origin as needed)
builder.Services.AddCors(options => {
    options.AddDefaultPolicy(policy => {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseExceptionHandler();

// Enable CORS middleware
app.UseCors();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseOutputCache();

var api = app.MapGroup("/api");

api.MapPost("check-login", async (LoginRequest data) =>
{\
    // Validate inputs
    if (data.Id <= 0 || string.IsNullOrEmpty(data.Password))
        return Results.BadRequest("Invalid input data.");

    // Check login credentials against the database
    bool isValid = DataLayer.CheckLogin(connectionString, data.Id, data.Password);\

    // Return appropriate response based on login validation
    if (isValid)
    {
        return Results.Ok(new { success = true, message = "Login Successful" });
    }

    return Results.Json(new { success = false, message = "Invalid ID or Password" }, statusCode: 401);
})
.WithName("CheckLogin");


app.MapDefaultEndpoints();

app.UseFileServer();

app.Run();
