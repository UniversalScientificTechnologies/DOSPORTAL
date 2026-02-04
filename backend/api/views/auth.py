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
    SignupResponseSerializer,
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

    # First check if user exists
    try:
        user = DjangoUser.objects.get(username=username)
    except DjangoUser.DoesNotExist:
        return Response(
            {"detail": "Invalid username or password."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # Check if inactive (approval pending)
    if not user.is_active:
        return Response(
            {"detail": "Account has not been approved by an administrator yet."},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Verify password
    if not user.check_password(password):
        return Response(
            {"detail": "Invalid username or password."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # User is valid and active - issue token
    token, created = Token.objects.get_or_create(user=user)
    return Response(
        {
            "detail": "Login successful.",
            "username": user.username,
            "token": token.key,
        },
        status=status.HTTP_200_OK,
    )


@extend_schema(
    request=SignupRequestSerializer,
    responses={201: SignupResponseSerializer},
    description="Create a new user account",
    tags=["Authentication"],
)
@api_view(["POST"])
@permission_classes((AllowAny,))
def Signup(request):
    """API signup endpoint that creates a new user account."""
    username = request.data.get("username")
    first_name = request.data.get("first_name")
    last_name = request.data.get("last_name")
    email = request.data.get("email")
    password = request.data.get("password")
    password_confirm = request.data.get("password_confirm")

    if (
        not username
        or not first_name
        or not last_name
        or not email
        or not password
        or not password_confirm
    ):
        return Response(
            {
                "detail": "Username, first name, last name, email, password, and password confirmation are required."
            },
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

    if DjangoUser.objects.filter(email=email).exists():
        return Response(
            {"detail": "Email already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user = DjangoUser.objects.create_user(
            username=username,
            password=password,
            email=email,
            first_name=first_name,
            last_name=last_name,
        )
        user.is_active = False
        user.save(update_fields=["is_active"])
        return Response(
            {
                "detail": "Account created successfully. Awaiting admin approval.",
                "username": user.username,
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
