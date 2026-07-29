<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Government Portal Loading</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background-color: #556B2F; /* Olive Green */
            color: #FFF;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            overflow: hidden;
        }

        .container {
            text-align: center;
        }

        .title {
            font-size: 2.5rem;
            color: #32CD32; /* Bright Green */
        }

        .subtitle {
            font-size: 1.5rem;
            color: #FFA500; /* Orange */
            margin-bottom: 2rem;
        }

        .loading-bar {
            position: relative;
            width: 80%;
            height: 20px;
            background-color: #D3D3D3;
            border-radius: 10px;
            overflow: hidden;
            margin: 0 auto;
        }

        .loading-progress {
            position: absolute;
            height: 100%;
            width: 0;
            background-color: #32CD32; /* Bright Green */
            border-radius: 10px;
            animation: loading 5s linear forwards;
        }

        @keyframes loading {
            from {
                width: 0;
            }
            to {
                width: 100%;
            }
        }

        .footer {
            margin-top: 1rem;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="title">Government Portal</div>
        <div class="subtitle">Transparency | Efficiency | Service</div>
        <div class="loading-bar">
            <div class="loading-progress"></div>
        </div>
        <div class="footer">Loading... Please Wait</div>
    </div>

    <script>
        // Redirect after loading completes
        setTimeout(() => {
            window.location.href = "next-page.html"; // Replace with your target URL
        }, 5000); // 5 seconds
    </script>
</body>
</html>
