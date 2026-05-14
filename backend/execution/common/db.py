from __future__ import annotations

import os
from typing import Any

import pymysql


def env_value(name: str, default: str) -> str:
    return os.getenv(name, default)


def connect_mysql(
    *,
    host_env: str,
    port_env: str,
    user_env: str,
    password_env: str,
    database_env: str,
    default_host: str,
    default_port: int,
    default_user: str,
    default_password: str,
    default_database: str,
    autocommit: bool,
    password_can_be_disabled: bool = False,
) -> pymysql.connections.Connection:
    password = env_value(password_env, default_password)
    if password_can_be_disabled and env_value("LOCAL_DB_NO_PASSWORD", "").lower() == "true":
        password = ""

    return pymysql.connect(
        host=env_value(host_env, default_host),
        port=int(env_value(port_env, str(default_port))),
        user=env_value(user_env, default_user),
        password=password,
        database=env_value(database_env, default_database),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=autocommit,
    )
