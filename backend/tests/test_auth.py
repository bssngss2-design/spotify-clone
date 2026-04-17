def test_register(client):
    r = client.post("/api/auth/register", json={"email": "new@test.com", "password": "pass123"})
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["user"]["email"] == "new@test.com"


def test_register_duplicate(client):
    client.post("/api/auth/register", json={"email": "dup@test.com", "password": "pass123"})
    r = client.post("/api/auth/register", json={"email": "dup@test.com", "password": "pass123"})
    assert r.status_code == 400


def test_login(client, test_user):
    r = client.post("/api/auth/login", json={"email": "test@example.com", "password": "testpass"})
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_login_wrong_password(client, test_user):
    r = client.post("/api/auth/login", json={"email": "test@example.com", "password": "wrong"})
    assert r.status_code == 401


def test_me(authed_client, test_user):
    r = authed_client.get("/api/auth/me")
    assert r.status_code == 200
    assert r.json()["email"] == "test@example.com"


def test_me_no_token(client):
    r = client.get("/api/auth/me")
    assert r.status_code == 401
