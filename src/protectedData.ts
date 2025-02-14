async function fetchProtectedData() {
  const accessToken = localStorage.getItem('access_token');

  const response = await fetch('https://your-api.com/protected-route', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();
  console.log(data);
}
