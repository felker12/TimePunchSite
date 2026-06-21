using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using System.Diagnostics;
using System.Security.Claims;
using System.Text;
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

//Configure JWT authentication
var jwtKey = builder.Configuration["Jwt:Key"];
var key = Encoding.UTF8.GetBytes(jwtKey!);

//Set up authentication with JWT Bearer tokens
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateIssuerSigningKey = true,
        ValidateLifetime = true,

        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key)
    };
});

//Add authorization services
builder.Services.AddAuthorization();

//Add the DatabaseService to the dependency injection container
//scoped lifetime is appropriate for database services to ensure a new instance per request
builder.Services.AddScoped<DatabaseService>();
builder.Services.AddScoped<PasswordService>();
builder.Services.AddScoped<EmployeeRepository>();

//Add the JwtService to the dependency injection container
builder.Services.AddScoped<JwtService>();

var app = builder.Build();

//Configure the HTTP request pipeline.
app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseOutputCache();

//Enable authentication and authorization middleware
app.UseAuthentication();
app.UseAuthorization();

var api = app.MapGroup("/api");

api.MapPost("check-login", (LoginRequest data, EmployeeRepository repo, JwtService jwtService) =>
{
    //Validate inputs
    if (data.Id <= 0 || string.IsNullOrEmpty(data.Password))
        return Results.BadRequest("Invalid input data.");

    //Check login credentials against the database
    //bool isValid = repo.CheckLogin(data.Id, data.Password);
    LoginResult loginResult = repo.CheckLogin(data.Id, data.Password);

    if (!loginResult.Success)
        return Results.Json(new { success = false, message = "Invalid ID or Password" }, statusCode: 401);

    var token = jwtService.GenerateToken(data.Id, loginResult.Role?.ToString() ?? string.Empty);

    return Results.Ok(new
    {
        success = true,
        token,
        role = loginResult.Role?.ToString() ?? "Unknown"
    });
})
.WithName("CheckLogin");

//Endpoint requires authentication
api.MapPost("get-timepunches-data", [Authorize] (PunchDataRequest data, EmployeeRepository repo, ClaimsPrincipal user) =>
{
    int userId = getUserIdFromClaims(user);
    var punches = repo.GetTimePunchDataList(userId, data.PunchLimit);

    return Results.Ok(punches);
})
.WithName("GetTimePunchesData");

api.MapPost("get-user-id", [Authorize] (ClaimsPrincipal user) =>
{
    return Results.Ok(new { id = getUserIdFromClaims(user) });
}).WithName("GetId");

api.MapPost("get-user-role", [Authorize] (ClaimsPrincipal user) =>
{
    return Results.Ok(new { role = getUserRoleFromClaims(user).ToString() });
}).WithName("GetRole");

api.MapPost("perform-punch", [Authorize] (TimePunchAction action, ClaimsPrincipal user, EmployeeRepository repo) =>
{
    int id = getUserIdFromClaims(user);
    bool success = repo.PerformPunchAction(id, action.ActionType);

    if (!success)
        return Results.BadRequest("Failed to perform punch action.");

    return Results.Ok();
}).WithName("PerformPunch");

api.MapPost("get-timepunches-for-week", [Authorize(Roles = "Admin,Manager")] (WeeklyReportRequest data, ClaimsPrincipal user, EmployeeRepository repo) =>
{
    var punches = repo.GetEmployeeTimePunchesListForWeek(data.Day);
    return Results.Ok(punches);
}).WithName("GetTimePunchesForWeek");

api.MapPost("update-timepunch", [Authorize(Roles = "Admin,Manager")] (TimePunchUpdateRequest request, ClaimsPrincipal user, EmployeeRepository repo) => 
{
    //TODO: Implement this endpoint to allow admins/managers to update time punches
    Debug.WriteLine($"Received update request for EmployeeID: {request.Punch.EmployeeID}, TimePunchID: {request.Punch.TimePunchID}");

    bool success = repo.UpdateTimePunch(request.Punch);
    return Results.Ok(success);
}).WithName("UpdateTimepunch");

app.MapDefaultEndpoints();

app.UseFileServer();

app.Run();

static int getUserIdFromClaims(ClaimsPrincipal user)
{
    var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier);

    return userIdClaim == null ? throw new InvalidOperationException("User ID claim is missing.") : int.Parse(userIdClaim.Value);
}

static EmployeeRole getUserRoleFromClaims(ClaimsPrincipal user)
{
    var userRoleClaim = user.FindFirst(ClaimTypes.Role)?.Value;

    EmployeeRole role = userRoleClaim switch
    {
        nameof(EmployeeRole.Admin) => EmployeeRole.Admin,
        nameof(EmployeeRole.Manager) => EmployeeRole.Manager,
        _ => EmployeeRole.Employee
    };

    return role;
}
