import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Input,
  useToast,
  List,
  ListItem,
  IconButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Image,
  InputGroup,
  InputRightElement,
} from '@chakra-ui/react';
import { DeleteIcon, AttachmentIcon, EditIcon } from '@chakra-ui/icons';
import { UPLOAD_PRESET, UPLOAD_URL } from '../config/cloudinary';

interface Person {
  id: string;
  name: string;
  notes: string;
  imageUrl?: string;
}

interface Group {
  id: string;
  name: string;
  memberIds: string[];
}

export default function Dashboard() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonNotes, setNewPersonNotes] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen: isGroupModalOpen, onOpen: onGroupModalOpen, onClose: onGroupModalClose } = useDisclosure();
  const { isOpen: isEditPersonModalOpen, onOpen: onEditPersonModalOpen, onClose: onEditPersonModalClose } = useDisclosure();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    loadPersons();
    loadGroups();
  }, [currentUser, navigate]);

  async function loadPersons() {
    if (!currentUser) return;

    try {
      const q = query(
        collection(db, 'persons'),
        where('userId', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const personsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Person[];
      setPersons(personsList);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load persons',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }

  async function loadGroups() {
    if (!currentUser) return;

    try {
      const q = query(
        collection(db, 'groups'),
        where('userId', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const groupsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Group[];
      setGroups(groupsList);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load groups',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }

  async function uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
      console.log('Uploading image to Cloudinary...');
      const response = await fetch(UPLOAD_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Cloudinary upload failed:', errorData);
        throw new Error(`Upload failed: ${errorData}`);
      }

      const data = await response.json();
      console.log('Cloudinary upload response:', data);
      return data.secure_url;
    } catch (error) {
      console.error('Image upload error:', error);
      throw new Error('Failed to upload image');
    }
  }

  async function handleAddPerson(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || !newPersonName.trim()) return;

    try {
      setLoading(true);
      let imageUrl: string | null = null;

      if (imageFile) {
        try {
          imageUrl = await uploadImage(imageFile);
          console.log('Image uploaded successfully:', imageUrl);
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          toast({
            title: 'Image Upload Error',
            description: 'Failed to upload image. Please try again.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          return;
        }
      }

      const personData: any = {
        name: newPersonName,
        notes: newPersonNotes,
        userId: currentUser.uid,
        createdAt: new Date(),
      };

      if (imageUrl) {
        personData.imageUrl = imageUrl;
      }

      const docRef = await addDoc(collection(db, 'persons'), personData);

      setPersons(prev => [...prev, {
        id: docRef.id,
        name: newPersonName,
        notes: newPersonNotes,
        imageUrl: imageUrl || undefined,
      }]);

      setNewPersonName('');
      setNewPersonNotes('');
      setImageFile(null);
      setImagePreview(null);

      toast({
        title: 'Success',
        description: 'Person added successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error adding person:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add person',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdatePerson(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || !editingPerson || !editingPerson.name.trim()) return;

    try {
      setLoading(true);
      let imageUrl = editingPerson.imageUrl;

      if (imageFile) {
        try {
          imageUrl = await uploadImage(imageFile);
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          toast({
            title: 'Image Upload Error',
            description: 'Failed to upload image. Please try again.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          return;
        }
      }

      const personData: any = {
        name: editingPerson.name,
        notes: editingPerson.notes,
      };

      if (imageUrl) {
        personData.imageUrl = imageUrl;
      }

      await updateDoc(doc(db, 'persons', editingPerson.id), personData);

      setPersons(prev => prev.map(person => 
        person.id === editingPerson.id 
          ? { ...person, ...personData }
          : person
      ));

      setEditingPerson(null);
      setImageFile(null);
      setImagePreview(null);
      onEditPersonModalClose();

      toast({
        title: 'Success',
        description: 'Person updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating person:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update person',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || !newGroupName.trim()) return;

    try {
      setLoading(true);
      const docRef = await addDoc(collection(db, 'groups'), {
        name: newGroupName,
        memberIds: [],
        userId: currentUser.uid,
        createdAt: new Date(),
      });

      setGroups(prev => [...prev, {
        id: docRef.id,
        name: newGroupName,
        memberIds: [],
      }]);

      setNewGroupName('');
      onGroupModalClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add group',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || !editingGroup || !editingGroup.name.trim()) return;

    try {
      setLoading(true);
      await updateDoc(doc(db, 'groups', editingGroup.id), {
        name: editingGroup.name,
      });

      setGroups(prev => prev.map(group => 
        group.id === editingGroup.id 
          ? { ...group, name: editingGroup.name }
          : group
      ));

      setEditingGroup(null);
      onGroupModalClose();

      toast({
        title: 'Success',
        description: 'Group updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating group:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update group',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }

  function handleEditPerson(person: Person) {
    setEditingPerson(person);
    onEditPersonModalOpen();
  }

  function handleEditGroup(group: Group) {
    setEditingGroup(group);
    onGroupModalOpen();
  }

  async function handleDeletePerson(personId: string) {
    try {
      await deleteDoc(doc(db, 'persons', personId));
      setPersons(prev => prev.filter(person => person.id !== personId));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete person',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }

  async function handleDeleteGroup(groupId: string) {
    try {
      await deleteDoc(doc(db, 'groups', groupId));
      setGroups(prev => prev.filter(group => group.id !== groupId));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete group',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to log out',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <Box maxW="container.md" mx="auto" mt={8} p={6}>
      <HStack justify="space-between" mb={6}>
        <Text fontSize="2xl" fontWeight="bold">My Peeps</Text>
        <Button onClick={handleLogout} colorScheme="red">
          Logout
        </Button>
      </HStack>

      <Tabs>
        <TabList>
          <Tab>People</Tab>
          <Tab>Groups</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <form onSubmit={handleAddPerson}>
              <VStack spacing={4} mb={8}>
                <HStack width="full" spacing={2}>
                  <Input
                    placeholder="Person's name"
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                    required
                    flex={1}
                  />
                  <Button
                    as="label"
                    htmlFor="image-upload"
                    colorScheme="blue"
                    variant="outline"
                    cursor="pointer"
                    minW="120px"
                  >
                    <HStack spacing={2}>
                      <AttachmentIcon />
                      <Text>Photo</Text>
                    </HStack>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      display="none"
                      id="image-upload"
                    />
                  </Button>
                </HStack>
                <Input
                  placeholder="Notes (optional)"
                  value={newPersonNotes}
                  onChange={(e) => setNewPersonNotes(e.target.value)}
                />
                {imagePreview && (
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    maxH="200px"
                    borderRadius="md"
                  />
                )}
                <Button
                  type="submit"
                  colorScheme="blue"
                  width="full"
                  isLoading={loading}
                >
                  Add Person
                </Button>
              </VStack>
            </form>

            <List spacing={3}>
              {persons.map(person => (
                <ListItem
                  key={person.id}
                  p={4}
                  borderWidth={1}
                  borderRadius="md"
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <HStack spacing={4}>
                    {person.imageUrl ? (
                      <Image
                        src={person.imageUrl}
                        alt={person.name}
                        boxSize="50px"
                        borderRadius="full"
                        objectFit="cover"
                      />
                    ) : (
                      <Box
                        boxSize="50px"
                        borderRadius="full"
                        bg="gray.200"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text fontSize="xl" color="gray.500">
                          {person.name.charAt(0)}
                        </Text>
                      </Box>
                    )}
                    <Box>
                      <Text fontWeight="bold">{person.name}</Text>
                      {person.notes && <Text color="gray.600">{person.notes}</Text>}
                    </Box>
                  </HStack>
                  <HStack>
                    <IconButton
                      aria-label="Edit person"
                      icon={<EditIcon />}
                      onClick={() => handleEditPerson(person)}
                      colorScheme="blue"
                      variant="ghost"
                    />
                    <IconButton
                      aria-label="Delete person"
                      icon={<DeleteIcon />}
                      onClick={() => handleDeletePerson(person.id)}
                      colorScheme="red"
                      variant="ghost"
                    />
                  </HStack>
                </ListItem>
              ))}
            </List>
          </TabPanel>

          <TabPanel>
            <Button onClick={onGroupModalOpen} colorScheme="blue" mb={8}>
              Create New Group
            </Button>

            <List spacing={3}>
              {groups.map(group => (
                <ListItem
                  key={group.id}
                  p={4}
                  borderWidth={1}
                  borderRadius="md"
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Link to={`/groups/${group.id}`}>
                    <Box>
                      <Text fontWeight="bold">{group.name}</Text>
                      <Text color="gray.600">
                        {group.memberIds.length} members
                      </Text>
                    </Box>
                  </Link>
                  <HStack>
                    <IconButton
                      aria-label="Edit group"
                      icon={<EditIcon />}
                      onClick={() => handleEditGroup(group)}
                      colorScheme="blue"
                      variant="ghost"
                    />
                    <IconButton
                      aria-label="Delete group"
                      icon={<DeleteIcon />}
                      onClick={() => handleDeleteGroup(group.id)}
                      colorScheme="red"
                      variant="ghost"
                    />
                  </HStack>
                </ListItem>
              ))}
            </List>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Edit Person Modal */}
      <Modal isOpen={isEditPersonModalOpen} onClose={onEditPersonModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Person</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={4}>
            <form onSubmit={handleUpdatePerson}>
              <VStack spacing={4}>
                <Input
                  placeholder="Person's name"
                  value={editingPerson?.name || ''}
                  onChange={(e) => setEditingPerson(prev => prev ? { ...prev, name: e.target.value } : null)}
                  required
                />
                <Input
                  placeholder="Notes (optional)"
                  value={editingPerson?.notes || ''}
                  onChange={(e) => setEditingPerson(prev => prev ? { ...prev, notes: e.target.value } : null)}
                />
                <Button
                  as="label"
                  htmlFor="edit-image-upload"
                  colorScheme="blue"
                  variant="outline"
                  cursor="pointer"
                  width="full"
                >
                  <HStack spacing={2}>
                    <AttachmentIcon />
                    <Text>Change Photo</Text>
                  </HStack>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    display="none"
                    id="edit-image-upload"
                  />
                </Button>
                {imagePreview && (
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    maxH="200px"
                    borderRadius="md"
                  />
                )}
                <Button
                  type="submit"
                  colorScheme="blue"
                  width="full"
                  isLoading={loading}
                >
                  Update Person
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Group Modal */}
      <Modal isOpen={isGroupModalOpen} onClose={onGroupModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingGroup ? 'Edit Group' : 'Create New Group'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={4}>
            <form onSubmit={editingGroup ? handleUpdateGroup : handleAddGroup}>
              <VStack spacing={4}>
                <Input
                  placeholder="Group name"
                  value={editingGroup ? editingGroup.name : newGroupName}
                  onChange={(e) => {
                    if (editingGroup) {
                      setEditingGroup({ ...editingGroup, name: e.target.value });
                    } else {
                      setNewGroupName(e.target.value);
                    }
                  }}
                  required
                />
                <Button
                  type="submit"
                  colorScheme="blue"
                  width="full"
                  isLoading={loading}
                >
                  {editingGroup ? 'Update Group' : 'Create Group'}
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
} 