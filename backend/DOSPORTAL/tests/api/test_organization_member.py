"""
Tests for organization member management endpoints.
"""

from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from DOSPORTAL.models import Organization, OrganizationUser


class OrganizationMemberTests(TestCase):
    def setUp(self):
        """Set up test users and organization."""
        self.client = APIClient()

        # Create test users
        self.owner_user = User.objects.create_user(
            username="owner", password="testpass123", email="owner@test.com"
        )
        self.admin_user = User.objects.create_user(
            username="admin", password="testpass123", email="admin@test.com"
        )
        self.member_user = User.objects.create_user(
            username="member", password="testpass123", email="member@test.com"
        )
        self.new_user = User.objects.create_user(
            username="newuser", password="testpass123", email="new@test.com"
        )
        self.unrelated_user = User.objects.create_user(
            username="unrelated", password="testpass123", email="unrelated@test.com"
        )

        # Create organizations
        self.org = Organization.objects.create(
            name="Test Organization", data_policy="PU"
        )
        self.other_org = Organization.objects.create(
            name="Other Organization", data_policy="PU"
        )

        # Add users to organization with different roles
        OrganizationUser.objects.create(
            user=self.owner_user, organization=self.org, user_type="OW"
        )
        OrganizationUser.objects.create(
            user=self.admin_user, organization=self.org, user_type="AD"
        )
        OrganizationUser.objects.create(
            user=self.member_user, organization=self.org, user_type="ME"
        )

        self.url = f"/api/organizations/{self.org.id}/member/"

    def test_add_member_as_owner(self):
        """Owner should be able to add new members."""
        self.client.force_authenticate(user=self.owner_user)
        response = self.client.post(
            self.url, {"username": "newuser", "user_type": "ME"}
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            OrganizationUser.objects.filter(
                user=self.new_user, organization=self.org
            ).exists()
        )

    def test_add_member_as_admin(self):
        """Admin should be able to add new members."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            self.url, {"username": "newuser", "user_type": "ME"}
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            OrganizationUser.objects.filter(
                user=self.new_user, organization=self.org
            ).exists()
        )

    def test_add_member_as_regular_member(self):
        """Regular member should NOT be able to add new members."""
        self.client.force_authenticate(user=self.member_user)
        response = self.client.post(
            self.url, {"username": "newuser", "user_type": "ME"}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(
            OrganizationUser.objects.filter(
                user=self.new_user, organization=self.org
            ).exists()
        )

    def test_add_member_unauthenticated(self):
        """Unauthenticated users should not be able to add members."""
        response = self.client.post(
            self.url, {"username": "newuser", "user_type": "ME"}
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_add_nonexistent_user(self):
        """Adding a non-existent user should fail."""
        self.client.force_authenticate(user=self.owner_user)
        response = self.client.post(
            self.url, {"username": "doesnotexist", "user_type": "ME"}
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_add_duplicate_member(self):
        """Adding a user who is already a member should fail."""
        self.client.force_authenticate(user=self.owner_user)
        response = self.client.post(self.url, {"username": "member", "user_type": "ME"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already a member", response.data["detail"].lower())

    def test_add_member_with_owner_role(self):
        """Adding a member with OW role should fail."""
        self.client.force_authenticate(user=self.owner_user)
        response = self.client.post(
            self.url, {"username": "newuser", "user_type": "OW"}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_add_member_with_invalid_role(self):
        """Adding a member with invalid role should fail."""
        self.client.force_authenticate(user=self.owner_user)
        response = self.client.post(
            self.url, {"username": "newuser", "user_type": "INVALID"}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_add_member_as_admin_role(self):
        """Owner should be able to add a new admin."""
        self.client.force_authenticate(user=self.owner_user)
        response = self.client.post(
            self.url, {"username": "newuser", "user_type": "AD"}
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        org_user = OrganizationUser.objects.get(
            user=self.new_user, organization=self.org
        )
        self.assertEqual(org_user.user_type, "AD")

    def test_change_member_role_as_owner(self):
        """Owner should be able to change member roles."""
        self.client.force_authenticate(user=self.owner_user)
        response = self.client.put(self.url, {"username": "member", "user_type": "AD"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        org_user = OrganizationUser.objects.get(
            user=self.member_user, organization=self.org
        )
        self.assertEqual(org_user.user_type, "AD")

    def test_change_member_role_as_admin(self):
        """Admin should be able to change member roles."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.put(self.url, {"username": "member", "user_type": "AD"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_change_member_role_as_regular_member(self):
        """Regular member should NOT be able to change roles."""
        self.client.force_authenticate(user=self.member_user)
        response = self.client.put(self.url, {"username": "member", "user_type": "AD"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_change_role_to_invalid_value(self):
        """Changing role to invalid value should fail."""
        self.client.force_authenticate(user=self.owner_user)
        response = self.client.put(
            self.url, {"username": "member", "user_type": "INVALID"}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_remove_member_as_owner(self):
        """Owner should be able to remove members."""
        self.client.force_authenticate(user=self.owner_user)
        response = self.client.delete(self.url, {"username": "member"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(
            OrganizationUser.objects.filter(
                user=self.member_user, organization=self.org
            ).exists()
        )

    def test_remove_member_as_admin(self):
        """Admin should be able to remove members."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(self.url, {"username": "member"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_remove_member_as_regular_member(self):
        """Regular member should NOT be able to remove other members."""
        self.client.force_authenticate(user=self.member_user)
        response = self.client.delete(self.url, {"username": "admin"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_remove_self(self):
        """Any member should be able to remove themselves."""
        self.client.force_authenticate(user=self.member_user)
        response = self.client.delete(self.url, {"username": "member"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(
            OrganizationUser.objects.filter(
                user=self.member_user, organization=self.org
            ).exists()
        )

    def test_remove_owner(self):
        """Removing the owner should fail."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(self.url, {"username": "owner"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(
            OrganizationUser.objects.filter(
                user=self.owner_user, organization=self.org
            ).exists()
        )

    def test_remove_non_member(self):
        """Removing a non-member should fail."""
        self.client.force_authenticate(user=self.owner_user)
        response = self.client.delete(self.url, {"username": "unrelated"})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_operations_on_nonexistent_organization(self):
        """Operations on non-existent organization should fail."""
        self.client.force_authenticate(user=self.owner_user)
        fake_url = "/api/organizations/00000000-0000-0000-0000-000000000000/member/"

        # Try to add
        response = self.client.post(
            fake_url, {"username": "newuser", "user_type": "ME"}
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Try to update
        response = self.client.put(fake_url, {"username": "member", "user_type": "AD"})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Try to delete
        response = self.client.delete(fake_url, {"username": "member"})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_missing_username_parameter(self):
        """Request without username should fail."""
        self.client.force_authenticate(user=self.owner_user)
        response = self.client.post(self.url, {"user_type": "ME"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unrelated_user_cannot_add_members(self):
        """User not in organization should not be able to add members."""
        self.client.force_authenticate(user=self.unrelated_user)
        response = self.client.post(
            self.url, {"username": "newuser", "user_type": "ME"}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_cannot_add_to_different_org(self):
        """Owner of one organization should not be able to add members to a different organization."""
        self.client.force_authenticate(user=self.owner_user)
        other_org_url = f"/api/organizations/{self.other_org.id}/member/"
        response = self.client.post(
            other_org_url, {"username": "newuser", "user_type": "ME"}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        # Verify the user was not added
        self.assertFalse(
            OrganizationUser.objects.filter(
                user=self.new_user, organization=self.other_org
            ).exists()
        )
