"""Authentication endpoints."""

import os
import logging
from django.contrib.auth import authenticate
from django.contrib.auth.models import User as DjangoUser
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status
from rest_framework.authtoken.models import Token
from drf_spectacular.utils import extend_schema

from api.serializers import (
    LoginRequestSerializer,
    LoginResponseSerializer,
    SignupRequestSerializer,
)

logger = logging.getLogger("api.auth")


@extend_schema(
    request=LoginRequestSerializer,
    responses={200: LoginResponseSerializer},
    description="Authenticate user and return authentication token",
    tags=["Authentication"],
)
@api_view(["POST"])
@permission_classes((AllowAny,))
def Login(request):
    """API login endpoint that accepts username and password."""
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response(
            {"detail": "Username and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(request, username=username, password=password)

    if user is not None:
        token, created = Token.objects.get_or_create(user=user)
        return Response(
            {
                "detail": "Login successful.",
                "username": user.username,
                "token": token.key,
            },
            status=status.HTTP_200_OK,
        )
    else:
        return Response(
            {"detail": "Invalid username or password."},
            status=status.HTTP_401_UNAUTHORIZED,
        )


@extend_schema(
    request=SignupRequestSerializer,
    responses={201: LoginResponseSerializer},
    description="Create a new user account",
    tags=["Authentication"],
)
@api_view(["POST"])
@permission_classes((AllowAny,))
def Signup(request):
    """API signup endpoint that creates a new user account."""
    username = request.data.get("username")
    password = request.data.get("password")
    password_confirm = request.data.get("password_confirm")
    email = request.data.get("email", "")

    if not username or not password or not password_confirm:
        return Response(
            {"detail": "Username, password, and password confirmation are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if password != password_confirm:
        return Response(
            {"detail": "Passwords do not match."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(password) < 8:
        return Response(
            {"detail": "Password must be at least 8 characters long."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if DjangoUser.objects.filter(username=username).exists():
        return Response(
            {"detail": "Username already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user = DjangoUser.objects.create_user(
            username=username, password=password, email=email
        )
        token, created = Token.objects.get_or_create(user=user)
        return Response(
            {
                "detail": "Account created successfully.",
                "username": user.username,
                "token": token.key,
            },
            status=status.HTTP_201_CREATED,
        )
    except Exception:
        logger.exception("Error creating account for username %s", username)
        return Response(
            {"detail": "An error occurred while creating the account."},
            status=status.HTTP_400_BAD_REQUEST,
        )


@extend_schema(tags=["Authentication"])
@api_view(["POST"])
@permission_classes((IsAuthenticated,))
def Logout(request):
    """API logout endpoint. Delete the token."""
    request.user.auth_token.delete()
    return Response(
        {"detail": "Logout successful."},
        status=status.HTTP_200_OK,
    )


@extend_schema(
    description="Get API version and git information",
    tags=["System"],
)
@api_view(["GET"])
@permission_classes((AllowAny,))
def Version(request):
    """Return git version information."""
    return Response(
        {
            "git_commit": os.getenv("GIT_COMMIT", "unknown"),
            "git_branch": os.getenv("GIT_BRANCH", "unknown"),
        }
    )
