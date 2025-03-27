import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
} from 'firebase/firestore';
import {
  Box,
  VStack,
  Text,
  List,
  ListItem,
  Button,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Select,
} from '@chakra-ui/react';

interface Person {
  id: string;
  name: string;
  notes: string;
}

interface Group {
  id: string;
  name: string;
  memberIds: string[];
}

export default function GroupPage() {
  const { groupId } = useParams();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Person[]>([]);
  const [allPersons, setAllPersons] = useState<Person[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    if (groupId) {
      loadGroup();
      loadAllPersons();
    }
  }, [groupId]);

  useEffect(() => {
    if (group) {
      loadMembers();
    }
  }, [group]);

  async function loadGroup() {
    if (!groupId) return;

    try {
      const groupDoc = await getDoc(doc(db, 'groups', groupId));
      if (groupDoc.exists()) {
        setGroup({ id: groupDoc.id, ...groupDoc.data() } as Group);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load group',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }

  async function loadAllPersons() {
    try {
      const q = query(collection(db, 'persons'));
      const querySnapshot = await getDocs(q);
      const personsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Person[];
      setAllPersons(personsList);
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

  async function loadMembers() {
    if (!group) return;

    try {
      const membersList = await Promise.all(
        group.memberIds.map(async (personId) => {
          const personDoc = await getDoc(doc(db, 'persons', personId));
          if (personDoc.exists()) {
            return { id: personDoc.id, ...personDoc.data() } as Person;
          }
          return null;
        })
      );
      setMembers(membersList.filter((person): person is Person => person !== null));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load group members',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }

  async function handleAddMember() {
    if (!groupId || !selectedPersonId) return;

    try {
      const groupRef = doc(db, 'groups', groupId);
      const updatedMemberIds = [...(group?.memberIds || []), selectedPersonId];
      await updateDoc(groupRef, { memberIds: updatedMemberIds });
      setGroup(prev => prev ? { ...prev, memberIds: updatedMemberIds } : null);
      onClose();
      setSelectedPersonId('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add member to group',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }

  if (!group) {
    return <Text>Loading...</Text>;
  }

  return (
    <Box maxW="container.md" mx="auto" mt={8} p={6}>
      <VStack spacing={6} align="stretch">
        <Text fontSize="2xl" fontWeight="bold">{group.name}</Text>
        
        <Button onClick={onOpen} colorScheme="blue">
          Add Member
        </Button>

        <List spacing={3}>
          {members.map(member => (
            <ListItem
              key={member.id}
              p={4}
              borderWidth={1}
              borderRadius="md"
            >
              <Text fontWeight="bold">{member.name}</Text>
              {member.notes && <Text color="gray.600">{member.notes}</Text>}
            </ListItem>
          ))}
        </List>

        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Add Member to Group</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={4}>
              <Select
                placeholder="Select a person"
                value={selectedPersonId}
                onChange={(e) => setSelectedPersonId(e.target.value)}
                mb={4}
              >
                {allPersons
                  .filter(person => !group.memberIds.includes(person.id))
                  .map(person => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
              </Select>
              <Button
                colorScheme="blue"
                onClick={handleAddMember}
                isDisabled={!selectedPersonId}
              >
                Add to Group
              </Button>
            </ModalBody>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
} 